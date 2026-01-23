import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');

    if (!empresaId) return NextResponse.json([]);

    try {
        const mensagens = await prisma.mensagem.findMany({
            where: {
                usuario: { empresaId: empresaId } // Filtro SaaS
            },
            include: {
                usuario: { select: { nome: true } }
            },
            orderBy: { dataIso: 'desc' },
            take: 20
        });
        return NextResponse.json(mensagens);
    } catch (error) {
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const novaMsg = await prisma.mensagem.create({
            data: {
                texto: body.texto,
                dataIso: new Date().toISOString(),
                usuarioId: parseInt(body.usuarioId)
            }
        });
        return NextResponse.json(novaMsg);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao enviar" }, { status: 500 });
    }
}