import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');

    if (!empresaId) return NextResponse.json([]);

    try {
        const folgas = await prisma.folga.findMany({
            where: {
                usuario: { empresaId: empresaId } // Filtro SaaS
            },
            include: {
                usuario: { select: { nome: true } }
            },
            orderBy: { data: 'desc' }
        });
        return NextResponse.json(folgas);
    } catch (error) {
        return NextResponse.json([], { status: 500 });
    }
}

// POST e DELETE continuam iguais pois usam usuarioId ou ID direto
export async function POST(request) {
    try {
        const body = await request.json();
        await prisma.folga.create({
            data: {
                data: new Date(body.data),
                usuarioId: parseInt(body.usuarioId)
            }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    try {
        await prisma.folga.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}