import nodemailer from "nodemailer";

const from = process.env.MAILSENDER
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: from,
        pass: process.env.PASSWORD
    }
})