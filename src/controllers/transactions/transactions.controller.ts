import { asyncHandler } from "../../utils/AsyncHandler";
import { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import Transaction from "../../models/transaction.models";
import Account from "../../models/acc.models";
import { ApiResponse } from "../../utils/ApiResponse";
import mongoose from "mongoose";
import Ledger from "../../models/ledger.models";
import { sendTransactionEmail } from "../../services/email.service";
import { AccountType, UserType } from "../../types/type";

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!req.user) {
        throw new ApiError(401, "User not authenticated");
    }

    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
        throw new ApiError(400, "Transfer amount must be a positive number");
    }

    // Validation
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        throw new ApiError(400, "FromAccount, toAccount, amount and idempotencyKey are required")
    };

    const fromUserAccount = await Account.findOne({
        _id: fromAccount,
        user: req.user._id
    });

    const toUserAccount = await Account.findOne({
        _id: toAccount,
    });

    if (!fromUserAccount) {
        throw new ApiError(403, "Invalid fromAccount or unauthorized access");
    }

    if (!toUserAccount) {
        throw new ApiError(400, "Invalid toAccount")
    };

    // Account Check up
    if (fromUserAccount._id.toString() === toUserAccount._id.toString()) {
        throw new ApiError(400, "Cannot transfer funds to the same account");
    }

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
            throw new ApiError(500, "Transaction processing failed, please retry")
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            throw new ApiError(500, "Transaction was reversed, please retry")
        }
    }

    // Acc Status
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        throw new ApiError(400, "Both fromAccount and toAccount must be ACTIVE to process transaction")
    }

    // Balance Check
    // console.log(fromUserAccount)
    const balance = await (fromUserAccount as unknown as AccountType).GetBalance();
    console.log(balance)
    // const balance = 0;

    if (balance < amount) {
        throw new ApiError(400, `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`)
    };

    let transaction;
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        transaction = (await Transaction.create([{
            fromAccount: fromUserAccount._id,
            toAccount: toUserAccount._id,
            amount: Number(amount),
            idempotencyKey,
            status: "PENDING"
        }], { session }))[0];

        // Create Debit Ledger Entry
        const debitLedgerEntry = await Ledger.create([{
            account: fromUserAccount._id,
            amount: Number(amount),
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        // Create Credit Ledger Entry
        const creditLedgerEntry = await Ledger.create([{
            account: toUserAccount._id,
            amount: Number(amount),
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        // Mark transaction as completed
        await Transaction.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

    } catch (error) {
        console.error("Transaction Error:", error);
        throw new ApiError(400, "Transaction is Pending due to some issue, please retry after sometime")
    }

    // Send Email
    try {
        await sendTransactionEmail({ userEmail: req.user.email, name: req.user.name, amount, toAccount });
    } catch (emailError) {
        console.error("Non-fatal: Failed to send transaction receipt email", emailError);
    }

    return res.status(201).json(
        new ApiResponse(201, { transaction: transaction }, "Transaction completed successfully")
    )
});

// Create Initial Funds Transaction
export const CreateIFT = asyncHandler(async (req: Request, res: Response) => {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!req.user) {
        throw new ApiError(401, "User not authenticated");
    }

    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
        throw new ApiError(400, "Transfer amount must be a positive number");
    }

    if (!toAccount || !amount || !idempotencyKey) {
        throw new ApiError(400, "toAccount, amount and idempotencyKey are required");
    };

    const toUserAccount = await Account.findOne({
        _id: toAccount,
    });

    if (!toUserAccount) {
        throw new ApiError(400, "Invalid toAccount");
    }

    const fromUserAccount = await Account.findOne({
        user: req.user._id
    });

    if (!fromUserAccount) {
        throw new ApiError(400, "System user account not found");
    }

    if (fromUserAccount._id.toString() === toUserAccount._id.toString()) {
        throw new ApiError(400, "Cannot transfer funds to the same account");
    }

    let transaction;
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        transaction = new Transaction({
            fromAccount: fromUserAccount._id,
            toAccount: toUserAccount._id,
            amount: numAmount,
            idempotencyKey,
            status: "PENDING"
        });

        const debitLedgerEntry = await Ledger.create([{
            account: fromUserAccount._id,
            amount: numAmount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        const creditLedgerEntry = await Ledger.create([{
            account: toUserAccount._id,
            amount: numAmount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

    } catch (err) {
        console.error("IFT Error:", err);
        throw new ApiError(400, "Initial Funds Transaction Error, please retry after sometime")
    }

    try {
        await sendTransactionEmail({ userEmail: req.user.email, name: req.user.name, amount: numAmount, toAccount });
    } catch (emailError) {
        console.error("Non-fatal: Failed to send IFT receipt email", emailError);
    }

    return res.status(201).json(
        new ApiResponse(201, { transaction: transaction }, "Initial funds transaction completed successfully")
    );
});