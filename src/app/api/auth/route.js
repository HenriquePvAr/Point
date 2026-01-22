import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SignJWT, jwtVerify } from 'jose'; // Biblioteca leve para JWT
import { cookies } from 'next/headers';

// CHAVE SECRETA (Em produção, coloque isso no .env)
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

        // Busca usuário no banco
        const user = await prisma.usuario.findUnique({
            where: { email: email }
        });

        // Verifica senha (idealmente use bcrypt aqui, mas mantive sua lógica atual)
        if (!user || user.senha !== senha) {
            return NextResponse.json({ success: false, message: "E-mail ou senha incorretos." }, { status: 401 });
        }

        // Verifica status
        if (!user.ativo) { // Assumindo que o campo no banco é booleano (ativo) ou string (status)
            return NextResponse.json({ success: false, message: "Seu acesso foi desativado." }, { status: 403 });
        }

        // === LÓGICA DO "LEMBRE DE MIM" ===
        if (lembreDeMim) {
            // Cria o Token JWT
            const token = await new SignJWT({ 
                sub: user.id.toString(), // ID do usuário
                email: user.email 
            })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('30d') // Expira em 30 dias
            .sign(SECRET_KEY);

            // Salva no Cookie do Navegador
            cookies().set('session_token', token, {
                httpOnly: true, // Javascript não consegue ler (segurança contra XSS)
                secure: process.env.NODE_ENV === 'production', // Só HTTPS em produção
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 30, // 30 dias em segundos
                path: '/',
            });
        }

        // Remove a senha antes de enviar pro front
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
// O front chama isso ao abrir o site para ver se tem cookie válido
export async function GET(request) {
    // Tenta pegar o cookie
    const token = cookies().get("session_token")?.value;

    if (!token) {
        return NextResponse.json({ success: false });
    }

    try {
        // Verifica se o token é válido e decifra
        const { payload } = await jwtVerify(token, SECRET_KEY);
        
        // Busca o usuário atualizado no banco (vai que ele foi demitido ontem?)
        const user = await prisma.usuario.findUnique({
            where: { id: parseInt(payload.sub) }
        });

        if (!user || !user.ativo) {
            return NextResponse.json({ success: false });
        }

        const { senha: _, ...userSemSenha } = user;
        
        return NextResponse.json({ 
            success: true, 
            user: userSemSenha 
        });

    } catch (error) {
        // Token inválido ou expirado
        return NextResponse.json({ success: false });
    }
}