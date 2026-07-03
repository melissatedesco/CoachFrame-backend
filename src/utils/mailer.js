import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export const sendPasswordResetEmail = async (to, resetUrl) => {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'CoachFrame <noreply@coachframe.it>',
        to,
        subject: 'Reset della tua password CoachFrame',
        html: `
            <h2>Reset password</h2>
            <p>Hai richiesto di reimpostare la password del tuo account CoachFrame.</p>
            <p>Clicca il link qui sotto (valido per 1 ora):</p>
            <a href="${resetUrl}" style="background:#0d6efd;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none">
                Reimposta password
            </a>
            <p style="margin-top:20px;color:#666;font-size:12px">
                Se non hai richiesto questo reset, ignora questa email.
            </p>
        `,
    })
}
