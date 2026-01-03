import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Conexão direta com o banco (para não depender do arquivo externo)
const prisma = new PrismaClient();

// Seus IPs permitidos (mantive os mesmos que você tinha)
const IPS_PERMITIDOS = ["::1", "127.0.0.1", "45.236.9.18"];

export async function POST(request) {
    // Tenta pegar o IP real
    let ip = request.headers.get("x-forwarded-for") || "::1";
    if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
    if (!ip) ip = "127.0.0.1";

    console.log(`Tentativa de ponto pelo IP: ${ip}`);

    // VERIFICAÇÃO DE SEGURANÇA
    if (!IPS_PERMITIDOS.includes(ip)) {
        return NextResponse.json({ 
            success: false, 
            message: `Bloqueado! IP ${ip} não autorizado.` 
        }, { status: 403 });
    }

    const body = await request.json();

    try {
        // Salva no Banco de Dados (Neon)
        const novoPonto = await prisma.ponto.create({
            data: {
                tipo: body.tipo,
                ip: ip,
                usuarioId: parseInt(body.usuarioId) // Converte ID para número
            }
        });

        return NextResponse.json({ success: true, message: "Ponto registrado!", registro: novoPonto });

    } catch (error) {
        console.error("Erro ao registrar ponto:", error);
        return NextResponse.json({ success: false, message: "Erro ao salvar no banco." }, { status: 500 });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    try {
        if (!userId) return NextResponse.json([]);

        // Busca histórico do usuário
        const historico = await prisma.ponto.findMany({
            where: {
                usuarioId: parseInt(userId)
            },
            orderBy: {
                data: 'desc'
            }
        });
        
        return NextResponse.json(historico);

    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        return NextResponse.json([]);
    }
}