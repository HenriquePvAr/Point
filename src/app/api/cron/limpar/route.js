import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const deleted = await prisma.notificacao.deleteMany({});
        
        return NextResponse.json({ 
            success: true, 
            message: `Limpeza concluída. ${deleted.count} notificações removidas.` 
        });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}