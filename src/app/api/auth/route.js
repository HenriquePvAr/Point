import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SignJWT, jwtVerify } from 'jose'; 
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode("PINGUIM_POINT_SECRET_KEY_2026");

// 1. LOGIN (POST)
export async function POST(request) {
    try {
        const body = await request.json();
        const { email, senha, lembreDeMim } = body;

        // Validação básica
        if (!email || !senha) {
             return NextResponse.json({ success: false, message: "Preencha e-mail e senha." }, { status: 400 });
        }

        // Busca usuário
        const user = await prisma.usuario.findUnique({
            where: { email: email }
        });

        // Verifica senha
        if (!user || user.senha !== senha) {
            return NextResponse.json({ success: false, message: "E-mail ou senha incorretos." }, { status: 401 });
        }

        // === VERIFICAÇÃO DE STATUS ===
        // Garante que só usuários com status "ativo" podem entrar
        if (user.status !== 'ativo') { 
            return NextResponse.json({ success: false, message: "Seu acesso foi desativado pelo administrador." }, { status: 403 });
        }

        // === LÓGICA DO "LEMBRE DE MIM" (COOKIE 30 DIAS) ===
        if (lembreDeMim) {
            const token = await new SignJWT({ 
                sub: user.id.toString(), 
                email: user.email 
            })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('30d')
            .sign(SECRET_KEY);

            cookies().set('session_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 30, // 30 dias
                path: '/',
            });
        }

        const { senha: _, ...userSemSenha } = user;

        return NextResponse.json({
            success: true,
            user: userSemSenha
        });

    } catch (error) {
        console.error("Erro no login:", error);
        return NextResponse.json({ success: false, message: "Erro interno no servidor." }, { status: 500 });
    }
}

// 2. VERIFICAR SESSÃO AUTOMÁTICA (GET)
// Chamado ao abrir o site para ver se já está logado
export async function GET(request) {
    const token = cookies().get("session_token")?.value;

    if (!token) {
        return NextResponse.json({ success: false });
    }

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        
        // Busca dados atualizados (para checar se foi bloqueado recentemente)
        const user = await prisma.usuario.findUnique({
            where: { id: parseInt(payload.sub) }
        });

        // Verifica status novamente
        if (!user || user.status !== 'ativo') {
            return NextResponse.json({ success: false });
        }

        const { senha: _, ...userSemSenha } = user;
        
        return NextResponse.json({ 
            success: true, 
            user: userSemSenha 
        });

    } catch (error) {
        return NextResponse.json({ success: false });
    }
}

// 3. LOGOUT (DELETE)
// Chamado pelo botão "Sair" para destruir o cookie no servidor
export async function DELETE() {
    cookies().delete("session_token"); 
    return NextResponse.json({ success: true });
}