import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // Certifique-se que o caminho está correto
import nodemailer from 'nodemailer';

export async function POST(request) {
    console.log("--- INICIANDO RECUPERAÇÃO DE SENHA ---");
    
    try {
        const { email } = await request.json();
        console.log(`1. Email recebido: ${email}`);

        // --- PASSO 1: BANCO DE DADOS ---
        const user = await prisma.usuario.findFirst({
            where: { email: email }
        });

        if (!user) {
            console.log("❌ Erro: E-mail não encontrado no banco.");
            return NextResponse.json({ success: false, message: "E-mail não encontrado." }, { status: 404 });
        }
        console.log(`2. Usuário encontrado: ${user.nome} (ID: ${user.id})`);

        // --- PASSO 2: GERAR E SALVAR CÓDIGO ---
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        
        await prisma.usuario.update({
            where: { id: user.id },
            data: { codigoRecuperacao: codigo }
        });
        console.log(`3. Código gerado e salvo no banco: ${codigo}`);

        // --- PASSO 3: CONFIGURAR NODEMAILER ---
        // AQUI FOI FEITO O AJUSTE: Agora ele pega das variáveis do sistema
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Lê a variável EMAIL_USER
                pass: process.env.EMAIL_PASS  // Lê a variável EMAIL_PASS
            },
            // Mantive os logs para você conseguir debugar no painel da Vercel
            logger: true,
            debug: true 
        });

        // --- PASSO 4: ENVIAR E-MAIL ---
        console.log("4. Tentando enviar e-mail...");
        const info = await transporter.sendMail({
            from: `"Sistema Ponto" <${process.env.EMAIL_USER}>`, // Boa prática: usar a variável aqui também
            to: email,
            subject: 'Recuperação de Senha - Código',
            text: `Seu código de recuperação é: ${codigo}`,
            html: `
                <div style="font-family: sans-serif; color: #333;">
                    <h2>Olá, ${user.nome}</h2>
                    <p>Seu código para redefinir a senha é:</p>
                    <div style="background: #eef2ff; padding: 15px; font-size: 24px; font-weight: bold; color: #1351b4; border-radius: 8px; text-align: center; margin: 20px 0;">
                        ${codigo}
                    </div>
                </div>
            `
        });

        console.log("✅ E-MAIL ENVIADO COM SUCESSO!");
        console.log("Message ID:", info.messageId);

        return NextResponse.json({ success: true, message: "Código enviado!" });

    } catch (error) {
        console.error("❌ ERRO CRÍTICO NO PROCESSO:", error);
        
        return NextResponse.json({ 
            success: false, 
            message: "Erro interno ao enviar e-mail.",
            errorDetails: error.message 
        }, { status: 500 });
    }
}