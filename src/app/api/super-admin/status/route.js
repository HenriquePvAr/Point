import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req) {
    try {
        const { id, status } = await req.json();
        
        await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: { statusAssinatura: status }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
    }
}