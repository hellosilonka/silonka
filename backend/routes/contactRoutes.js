import express from 'express';
import nodemailer from 'nodemailer';
import { asyncHandler, emailField, textField, httpError } from '../utils/http.js';
const router = express.Router();
router.post('/', asyncHandler(async (req, res) => {
    const name = textField(req.body.name, 'name', 100), email = emailField(req.body.email);
    const subject = textField(req.body.subject, 'subject', 150), message = textField(req.body.message, 'message', 5000);
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.ADMIN_EMAIL) throw httpError(503, 'Contact delivery is unavailable. Please email hello@silonka.com.');
    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }, connectionTimeout: 10000, socketTimeout: 15000 });
    await transport.sendMail({ from: process.env.EMAIL_USER, to: process.env.ADMIN_EMAIL, replyTo: email, subject: `Website enquiry: ${subject.replace(/[\r\n]/g, ' ')}`, text: `From: ${name} <${email}>\n\n${message}` });
    res.status(200).json({ message: 'Your message has been sent.' });
}));
export default router;
