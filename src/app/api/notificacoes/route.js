import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const notificacoes = await prisma.notificacao.findMany({
            orderBy: {
                criadoEm: 'desc' // Mais recentes primeiro
            },
            include: {
                usuario: {
                    select: { nome: true } // Traz o nome do funcionário junto
                }
            }
        });
        
        return NextResponse.json(notificacoes);
    } catch (error) {
        return NextResponse.json([], { status: 500 });
    }
}