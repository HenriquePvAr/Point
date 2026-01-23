import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// LISTAR NOTIFICAÇÕES (GET)
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');

    // 🔒 SEGURANÇA SAAS: Se não mandar o ID da empresa, não retorna nada.
    // Isso impede que uma empresa veja as notificações da outra.
    if (!empresaId) {
        return NextResponse.json([]);
    }

    try {
        const notificacoes = await prisma.notificacao.findMany({
            where: {
                usuario: {
                    empresaId: empresaId // <--- O FILTRO MÁGICO
                }
            },
            orderBy: {
                criadoEm: 'desc' // Mais recentes primeiro
            },
            include: {
                usuario: {
                    select: { nome: true } // Traz o nome do funcionário
                }
            },
            take: 50 // Boa prática: Limita às ultimas 50 para não pesar o painel
        });
        
        return NextResponse.json(notificacoes);
    } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        return NextResponse.json([], { status: 500 });
    }
}

// MARCAR COMO LIDA (PUT)
// Usado quando o Admin clica no sininho ou no "visto"
export async function PUT(request) {
    try {
        const body = await request.json();
        
        if (!body.id) return NextResponse.json({ success: false }, { status: 400 });

        await prisma.notificacao.update({
            where: { id: parseInt(body.id) },
            data: { lida: true }
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}