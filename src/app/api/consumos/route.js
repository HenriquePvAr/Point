import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Busca consumos e FAZ A LIMPEZA AUTOMÁTICA DE 15 DIAS
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    try {
        // --- 1. LÓGICA DE LIMPEZA AUTOMÁTICA (15 DIAS) ---
        // Calcula a data de 15 dias atrás
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 15);

        // Apaga tudo que for anterior a 15 dias atrás
        await prisma.consumo.deleteMany({
            where: {
                data: {
                    lt: dataLimite // 'lt' significa 'less than' (menor que / anterior a)
                }
            }
        });
        // --------------------------------------------------

        // Agora busca os dados atuais
        const whereClause = userId ? { usuarioId: parseInt(userId) } : {};
        
        const consumos = await prisma.consumo.findMany({
            where: whereClause,
            orderBy: { data: 'desc' }, // Mais recentes primeiro
            include: { usuario: { select: { nome: true } } } // Traz o nome do dono
        });

        return NextResponse.json(consumos);
    } catch (error) {
        console.error("Erro consumos:", error);
        return NextResponse.json({ error: "Erro ao buscar consumos" }, { status: 500 });
    }
}

// POST: Adicionar novo consumo
export async function POST(request) {
    try {
        const body = await request.json();
        const { nomeItem, valor, imagemUrl, usuarioId } = body;

        const novoConsumo = await prisma.consumo.create({
            data: {
                nomeItem,
                valor: parseFloat(valor),
                imagemUrl,
                usuarioId: parseInt(usuarioId)
            }
        });

        return NextResponse.json({ success: true, consumo: novoConsumo });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT: Editar consumo
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, nomeItem, valor, imagemUrl } = body;

        const atualizado = await prisma.consumo.update({
            where: { id: parseInt(id) },
            data: {
                nomeItem,
                valor: parseFloat(valor),
                imagemUrl
            }
        });

        return NextResponse.json({ success: true, consumo: atualizado });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE: Remover consumo
export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        await prisma.consumo.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}