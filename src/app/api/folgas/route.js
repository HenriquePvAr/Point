import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if(!userId) return NextResponse.json([]);

    const folgas = await prisma.folga.findMany({
        where: { usuarioId: parseInt(userId) }
    });
    // Retorna array de strings ISO das datas (ex: "2026-01-20")
    return NextResponse.json(folgas.map(f => f.data.toISOString().split('T')[0]));
}

export async function POST(request) {
    const { usuarioId, dataIso } = await request.json();
    const dataFolga = new Date(dataIso);

    // Verifica se já existe folga
    const existe = await prisma.folga.findFirst({
        where: { usuarioId: parseInt(usuarioId), data: dataFolga }
    });

    if (existe) {
        // Se existe, REMOVE (Toggle)
        await prisma.folga.delete({ where: { id: existe.id } });
        return NextResponse.json({ status: 'removed' });
    } else {
        // Se não existe, CRIA
        await prisma.folga.create({
            data: { usuarioId: parseInt(usuarioId), data: dataFolga }
        });
        return NextResponse.json({ status: 'added' });
    }
}