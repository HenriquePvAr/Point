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

        if (!email || !senha) {
             return NextResponse.json({ success: false, message: "Preencha e-mail e senha." }, { status: 400 });
        }

        const user = await prisma.usuario.findUnique({
            where: { email: email }
        });

        if (!user || user.senha !== senha) {
            return NextResponse.json({ success: false, message: "E-mail ou senha incorretos." }, { status: 401 });
        }

        // === CORREÇÃO AQUI ===
        // Antes estava (!user.ativo), mas teu banco usa user.status = "ativo"
        if (user.status !== 'ativo') { 
            return NextResponse.json({ success: false, message: "Seu acesso foi desativado pelo administrador." }, { status: 403 });
        }

        // === LÓGICA DO "LEMBRE DE MIM" ===
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
export async function GET(request) {
    const token = cookies().get("session_token")?.value;

    if (!token) {
        return NextResponse.json({ success: false });
    }

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        
        const user = await prisma.usuario.findUnique({
            where: { id: parseInt(payload.sub) }
        });

        // === CORREÇÃO AQUI TAMBÉM ===
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