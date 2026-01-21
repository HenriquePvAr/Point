import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
    try {
        const { destinatario, assunto, htmlBody } = await request.json();

        // Configuração do Gmail (A mesma que você já usa na recuperação de senha)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"Sistema Ponto" <${process.env.EMAIL_USER}>`,
            to: destinatario,
            subject: assunto,
            html: htmlBody
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}