import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode("PINGUIM_POINT_SECRET_KEY_2026");

export async function GET(req) {
    // 1. Segurança: Verificar se quem pede é o SUPER ADMIN
    const token = cookies().get("session_token")?.value;
    if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        // Coloque aqui o SEU EMAIL de super admin para garantir que só você entra
        if (payload.email !== "henrique@seuemail.com") { // <--- MUDE ISSO PARA SEU EMAIL REAL
             return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
        }

        // 2. Buscar todas as empresas (usuários tipo 'admin')
        const empresas = await prisma.usuario.findMany({
            where: { tipo: 'admin' }, // Filtra só os donos
            select: {
                id: true,
                nome: true,
                email: true,
                statusAssinatura: true,
                stripeCustomerId: true,
                criadoEm: true
            },
            orderBy: { criadoEm: 'desc' }
        });

        return NextResponse.json(empresas);

    } catch (e) {
        return NextResponse.json({ error: "Erro de servidor" }, { status: 500 });
    }
}