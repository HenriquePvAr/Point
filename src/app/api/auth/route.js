// src/app/api/auth/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Certifique-se que o caminho está certo
import { SignJWT, jwtVerify } from 'jose'; 
import { cookies } from 'next/headers';

// Recomendado: Mover isso para o .env (JWT_SECRET)
const SECRET_KEY = new TextEncoder().encode("PINGUIM_POINT_SECRET_KEY_2026");

// =====================================================================
// 1. LOGIN (POST)
// =====================================================================
export async function POST(request) {
    try {
        const body = await request.json();
        const { email, senha, lembreDeMim } = body;

        // 1. Validação básica de campos
        if (!email || !senha) {
             return NextResponse.json({ success: false, message: "Preencha e-mail e senha." }, { status: 400 });
        }

        // 2. Busca usuário + Dados da Empresa (Vital para o SaaS)
        const user = await prisma.usuario.findUnique({
            where: { email: email },
            include: {
                empresa: true // Trazemos a empresa para checar se ela pagou
            }
        });

        // 3. Validação de Credenciais
        // Nota: Em produção, use bcrypt.compare(senha, user.senha)
        if (!user || user.senha !== senha) {
            return NextResponse.json({ success: false, message: "E-mail ou senha incorretos." }, { status: 401 });
        }

        // 4. VERIFICAÇÃO DE STATUS DO USUÁRIO
        if (user.status !== 'ativo') { 
            return NextResponse.json({ success: false, message: "Seu acesso foi desativado pelo administrador." }, { status: 403 });
        }

        // 5. === BLOQUEIO FINANCEIRO / SAAS (NOVO) ===
        // Se NÃO for Super Admin, aplicamos as regras de negócio
        if (user.role !== 'SUPER_ADMIN') {
            
            // A empresa existe?
            if (!user.empresa) {
                return NextResponse.json({ success: false, message: "Usuário sem empresa vinculada." }, { status: 403 });
            }

            // A empresa está ativa?
            if (!user.empresa.ativo) {
                return NextResponse.json({ success: false, message: "O acesso da sua empresa está suspenso." }, { status: 403 });
            }

            // A assinatura venceu?
            const hoje = new Date();
            const vencimento = user.empresa.pagoAte ? new Date(user.empresa.pagoAte) : null;
            
            if (vencimento && vencimento < hoje) {
                return NextResponse.json({ 
                    success: false, 
                    message: "Assinatura da empresa expirada. Contate o suporte." 
                }, { status: 403 });
            }
        }

        // 6. GERAÇÃO DO TOKEN JWT
        // O token agora carrega quem é a empresa e qual o cargo (role)
        const token = await new SignJWT({ 
            sub: user.id.toString(), 
            email: user.email,
            role: user.role,         // SUPER_ADMIN, ADMIN, FUNCIONARIO
            empresaId: user.empresaId,
            nome: user.nome
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(lembreDeMim ? '30d' : '24h') // Expiração dinâmica
        .sign(SECRET_KEY);

        // 7. DEFINIÇÃO DO COOKIE
        cookies().set('session_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: lembreDeMim ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 dias ou 1 dia
            path: '/',
        });

        // Remove senha antes de enviar pro front
        const { senha: _, ...userSemSenha } = user;

        return NextResponse.json({
            success: true,
            user: userSemSenha,
            token: token // Opcional enviar no body se já vai no cookie, mas útil para debug
        });

    } catch (error) {
        console.error("Erro no login:", error);
        return NextResponse.json({ success: false, message: "Erro interno no servidor." }, { status: 500 });
    }
}

// =====================================================================
// 2. VERIFICAR SESSÃO AUTOMÁTICA (GET)
// =====================================================================
export async function GET(request) {
    const token = cookies().get("session_token")?.value;

    if (!token) {
        return NextResponse.json({ success: false }, { status: 401 });
    }

    try {
        // Verifica assinatura do token
        const { payload } = await jwtVerify(token, SECRET_KEY);
        
        // Busca dados atualizados no banco (para garantir que não foi bloqueado há 5 minutos)
        const user = await prisma.usuario.findUnique({
            where: { id: parseInt(payload.sub) },
            include: { empresa: true }
        });

        if (!user) return NextResponse.json({ success: false }, { status: 401 });

        // Revalida status (caso o admin tenha bloqueado enquanto o user estava logado)
        if (user.status !== 'ativo') return NextResponse.json({ success: false }, { status: 403 });
        if (user.role !== 'SUPER_ADMIN' && !user.empresa.ativo) return NextResponse.json({ success: false }, { status: 403 });

        const { senha: _, ...userSemSenha } = user;
        
        return NextResponse.json({ 
            success: true, 
            user: userSemSenha 
        });

    } catch (error) {
        // Token inválido ou expirado
        return NextResponse.json({ success: false }, { status: 401 });
    }
}

// =====================================================================
// 3. LOGOUT (DELETE)
// =====================================================================
export async function DELETE() {
    cookies().delete("session_token"); 
    return NextResponse.json({ success: true });
}