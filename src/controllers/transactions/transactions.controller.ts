import { asyncHandler } from "../../utils/AsyncHandler";
import { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import Transaction from "../../models/transaction.models";
import Account from "../../models/acc.models";
import { ApiResponse } from "../../utils/ApiResponse";
import mongoose from "mongoose";
import Ledger from "../../models/ledger.models";
import { sendTransactionEmail } from "../../services/email.service";
import { UserType } from "../../types/type";

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    // Validation
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        throw new ApiError(400, "FromAccount, toAccount, amount and idempotencyKey are required")
    };

    const fromUserAccount = await Account.findOne({
        _id: fromAccount,
    });

    const toUserAccount = await Account.findOne({
        _id: toAccount,
    });

    if (!fromUserAccount || !toUserAccount) {
        throw new ApiError(400, "Invalid fromAccount or toAccount")
    };

    // Validating idempotency Key
    const isTransactionAlreadyExists = await Transaction.findOne({
        idempotencyKey: idempotencyKey
    });

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json(
                new ApiResponse(200, { transactions: isTransactionAlreadyExists }, "Transaction already processed")
            )
        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json(
                new ApiResponse(200, "Transaction is still processing")
            )
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            new ApiError(500, "Transaction processing failed, please retry")
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            new ApiError(500, "Transaction was reversed, please retry")
        }
    }

    // Acc Status
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        new ApiError(400, "Both fromAccount and toAccount must be ACTIVE to process transaction")
    }

    // Balance Check
    const balance = await (fromUserAccount as unknown as UserType).GetBalance();
    // const balance = 0;

    if (balance < amount) {
        throw new ApiError(400, `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`)
    };

    let transaction;
    try {
        // Create Transaction
        const session = await mongoose.startSession()
        session.startTransaction()

        transaction = (await Transaction.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session }))[0]

        const debitLedgerEntry = await Ledger.create([{
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        await (() => {
            return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
        })()

        const creditLedgerEntry = await Ledger.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        await Transaction.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )


        await session.commitTransaction()
        session.endSession()
    } catch (error) {

        return res.status(400).json({
            message: "Transaction is Pending due to some issue, please retry after sometime",
        })

    }

    // Send Email
    await sendTransactionEmail({ userEmail: req.user.email, name: req.user.name, amount, toAccount })

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })
});