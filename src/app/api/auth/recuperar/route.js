import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export async function POST(request) {
    const { email } = await request.json();

    try {
        console.log(`Solicitação de senha para: ${email}`);

        // 1. Procura se o funcionário existe no banco
        const user = await prisma.usuario.findFirst({
            where: { email: email }
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "E-mail não encontrado no sistema." }, { status: 404 });
        }

        // 2. Gera o código
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Salva o código no cadastro do funcionário
        await prisma.usuario.update({
            where: { id: user.id },
            data: { codigoRecuperacao: codigo }
        });

        // 4. CONFIGURAÇÃO DO CARTEIRO (SEU GMAIL PESSOAL)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                // Quem ENVIA o e-mail (O Carteiro)
                user: 'henriquepaiva128@gmail.com', 
                
                // A Senha de App gerada neste e-mail (henriquepaiva128@gmail.com)
                pass: 'vajz ehed czaw ehtd' 
            }
        });

        // 5. O ENVIO
        await transporter.sendMail({
            from: '"Sistema Ponto" <henriquepaiva128@gmail.com>', // Quem manda
            to: email, // Quem recebe (o e-mail do funcionário: esbam, hotmail, etc)
            subject: 'Recuperação de Senha',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #071d41;">Olá, ${user.nome}!</h2>
                    <p>Você pediu para recuperar sua senha? Aqui está seu código:</p>
                    <div style="background: #eef2ff; padding: 20px; font-size: 28px; font-weight: bold; text-align: center; border-radius: 10px; color: #1351b4; letter-spacing: 5px; margin: 20px 0;">
                        ${codigo}
                    </div>
                    <p style="font-size: 12px; color: #666;">Copie este código e cole no sistema.</p>
                </div>
            `
        });

        return NextResponse.json({ success: true, message: "Código enviado com sucesso!" });

    } catch (error) {
        console.error("Erro no envio:", error);
        return NextResponse.json({ success: false, message: "Erro ao enviar e-mail." }, { status: 500 });
    }
}