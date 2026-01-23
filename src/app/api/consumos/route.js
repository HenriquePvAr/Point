import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// =================================================================================
// 1. GET: LISTAR CONSUMOS (Com filtro de Empresa + Limpeza Automática)
// =================================================================================
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const userId = searchParams.get('userId');

    // SEGURANÇA SAAS: Obrigatório informar a empresa
    if (!empresaId) {
        return NextResponse.json({ error: "ID da empresa obrigatório." }, { status: 400 });
    }

    try {
        // --- LÓGICA DE LIMPEZA AUTOMÁTICA (15 DIAS) ---
        // Mantém o banco leve apagando registros muito antigos
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 15);

        // Apaga consumos antigos DESTA empresa (ou global, se preferir manter limpo geral)
        // Aqui restringi à empresa para evitar efeitos colaterais em outros clientes
        await prisma.consumo.deleteMany({
            where: {
                data: { lt: dataLimite },
                usuario: { empresaId: empresaId }
            }
        });
        // --------------------------------------------------

        // Configura o filtro de busca
        const whereClause = {
            usuario: {
                empresaId: empresaId // Garante isolamento entre empresas
            }
        };

        // Se passar um usuário específico (ex: o funcionário vendo o próprio app), filtra
        if (userId) {
            whereClause.usuarioId = parseInt(userId);
        }

        const consumos = await prisma.consumo.findMany({
            where: whereClause,
            orderBy: { data: 'desc' },
            include: { 
                usuario: { 
                    select: { nome: true } // Traz o nome para mostrar na tabela do Admin
                } 
            } 
        });

        return NextResponse.json(consumos);

    } catch (error) {
        console.error("Erro consumos:", error);
        return NextResponse.json({ error: "Erro ao buscar consumos" }, { status: 500 });
    }
}

// =================================================================================
// 2. POST: ADICIONAR CONSUMO
// =================================================================================
export async function POST(request) {
    try {
        const body = await request.json();
        const { nomeItem, valor, imagemUrl, usuarioId } = body;

        if (!nomeItem || !valor || !usuarioId) {
            return NextResponse.json({ success: false, message: "Dados incompletos." }, { status: 400 });
        }

        const novoConsumo = await prisma.consumo.create({
            data: {
                nomeItem,
                valor: parseFloat(valor),
                imagemUrl,
                usuarioId: parseInt(usuarioId),
                data: new Date()
            }
        });

        return NextResponse.json({ success: true, consumo: novoConsumo });
    } catch (error) {
        console.error("Erro ao criar consumo:", error);
        return NextResponse.json({ success: false, error: "Erro interno." }, { status: 500 });
    }
}

// =================================================================================
// 3. PUT: EDITAR CONSUMO
// =================================================================================
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
        return NextResponse.json({ success: false, error: "Erro ao atualizar." }, { status: 500 });
    }
}

// =================================================================================
// 4. DELETE: REMOVER CONSUMO
// =================================================================================
export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false }, { status: 400 });

    try {
        await prisma.consumo.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}