import nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER!,
        pass: process.env.PASS!
    },
});

// Verify Connection
// transporter.verify((error, success) => {
//     if (error) {
//         console.error('Error connecting to email server:', error);
//     } else {
//         console.log('Email server is ready to send messages');
//     }
// });

const sendEmail = async (to: string, subject: string, text: string, html: string): Promise<void> => {
    try {
        const info: SentMessageInfo = await transporter.sendMail({
            from: `"Backend Ledger" <${process.env.NODEMAILER_USER}>`,
            to,
            subject,
            text,
            html,
        });

        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email:', error);
    }
};


interface RegistrationEmailParams {
    userEmail: string;
    name: string;
}

async function sendRegistrationEmail({ userEmail, name }: RegistrationEmailParams): Promise<void> {
    const subject = 'Welcome to Backend Ledger!';
    const text = `Hello ${name},\n\nThank you for registering at Backend Ledger. We're excited to have you on board!\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>Thank you for registering at Backend Ledger. We're excited to have you on board!</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}


interface TransactionEmailParams {
    userEmail: string;
    name: string;
    amount: number;
    toAccount: string;
}

async function sendTransactionEmail({ userEmail, name, amount, toAccount }: TransactionEmailParams): Promise<void> {
    const subject = 'Transaction Successful!';
    const text = `Hello ${name},\n\nYour transaction of $${amount} to account ${toAccount} was successful.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} to account ${toAccount} was successful.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

interface TransactionFailureEmailParams {
    userEmail: string;
    name: string;
    amount: number;
    toAccount: string;
}

async function sendTransactionFailureEmail({ userEmail, name, amount, toAccount }: TransactionFailureEmailParams): Promise<void> {
    const subject = 'Transaction Failed';
    const text = `Hello ${name},\n\nWe regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.\n\nBest regards,\nThe Backend Ledger Team`;
    const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

export {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};