import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// --- CONFIGURAÇÃO DO E-MAIL ---
const EMAIL_REMETENTE = "henriquepaiva128@gmail.com"; 
const SENHA_APP = "wrsh wmoc waln rvrv"; 

export async function POST(request) {
    const { email, codigo, novaSenha } = await request.json();

    // 1. Configura o Carteiro (Nodemailer)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_REMETENTE,
            pass: SENHA_APP
        }
    });

    // --- CENÁRIO 1: USUÁRIO PEDIU O CÓDIGO ---
    if (email && !codigo) {
        // Busca o usuário na memória
        const userIndex = global.usuarios.findIndex(u => u.email === email);
        
        if (userIndex === -1) {
            return NextResponse.json({ success: false, message: "E-mail não encontrado no sistema." }, { status: 404 });
        }

        // Gera código de 4 números
        const codigoGerado = Math.floor(1000 + Math.random() * 9000).toString();

        // Salva o código no usuário (no servidor)
        global.usuarios[userIndex].codigoRecuperacao = codigoGerado;

        try {
            // Envia o e-mail real
            await transporter.sendMail({
                from: `"Suporte Pinguim" <${EMAIL_REMETENTE}>`,
                to: email,
                subject: 'Código de Recuperação - Pinguim Manoa',
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                        <h2 style="color: #1351b4; text-align: center;">Pinguim Manoa</h2>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 16px;">Olá,</p>
                        <p style="font-size: 16px;">Recebemos uma solicitação para redefinir sua senha.</p>
                        <p style="font-size: 16px;">Use o código abaixo para continuar:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="background-color: #f0f4ff; color: #1351b4; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px; border: 2px solid #1351b4;">
                                ${codigoGerado}
                            </span>
                        </div>
                        <p style="font-size: 14px; color: #666;">Se você não solicitou isso, ignore este e-mail.</p>
                    </div>
                `
            });

            return NextResponse.json({ success: true, message: "Código enviado para seu e-mail!" });

        } catch (error) {
            console.error("Erro ao enviar e-mail:", error);
            return NextResponse.json({ success: false, message: "Falha ao enviar e-mail. Verifique a conexão." }, { status: 500 });
        }
    }

    // --- CENÁRIO 2: USUÁRIO ENVIOU O CÓDIGO E A NOVA SENHA ---
    if (email && codigo && novaSenha) {
        const userIndex = global.usuarios.findIndex(u => u.email === email);
        
        if (userIndex === -1) {
            return NextResponse.json({ success: false, message: "Usuário não encontrado." }, { status: 404 });
        }

        const usuario = global.usuarios[userIndex];

        // Verifica se o código bate
        if (usuario.codigoRecuperacao !== codigo) {
            return NextResponse.json({ success: false, message: "Código incorreto ou expirado." }, { status: 400 });
        }

        // Atualiza a senha
        global.usuarios[userIndex].senha = novaSenha;
        
        // Limpa o código usado
        delete global.usuarios[userIndex].codigoRecuperacao;

        return NextResponse.json({ success: true, message: "Senha alterada com sucesso!" });
    }

    return NextResponse.json({ success: false, message: "Dados inválidos." }, { status: 400 });
}