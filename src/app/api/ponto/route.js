import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma'; 

// === CONFIGURAÇÃO DOS LOCAIS PERMITIDOS (GEOLOCALIZAÇÃO) ===
const LOCAIS_PERMITIDOS = [
    { 
        nome: "Sede - Av. do Turismo", 
        // Coordenadas aproximadas do nº 1350 (Tarumã)
        lat: -3.041634, 
        lon: -60.069400, 
        raio: 300 // Raio de tolerância em metros
    },
    { 
        nome: "Filial - Col. Santo Antônio", 
        // Coordenadas aproximadas do nº 128 (Av. Francisco Queiroz)
        lat: -3.033600, 
        lon: -59.992800, 
        raio: 300 
    }
];

// Função para calcular distância (Fórmula de Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Raio da terra em metros
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const deltaP = (lat2 - lat1) * Math.PI / 180;
    const deltaL = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(deltaL / 2) * Math.sin(deltaL / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Retorna distância em metros
}

export async function POST(request) {
    const body = await request.json();
    const { latitude, longitude, usuarioId, tipo } = body;

    // 1. VERIFICAÇÃO SE A LOCALIZAÇÃO VEIO DO FRONT-END
    if (!latitude || !longitude) {
        return NextResponse.json({ 
            success: false, 
            message: "Localização não recebida. Ative o GPS do seu celular/computador." 
        }, { status: 400 });
    }

    console.log(`Tentativa de ponto em: ${latitude}, ${longitude}`);

    // 2. CÁLCULO DA DISTÂNCIA (Loop pelos locais permitidos)
    let localValido = false;
    let menorDistancia = Infinity;
    let localProximo = "";

    for (const local of LOCAIS_PERMITIDOS) {
        const dist = calcularDistancia(latitude, longitude, local.lat, local.lon);
        
        if (dist < menorDistancia) {
            menorDistancia = dist;
            localProximo = local.nome;
        }
        
        // Se estiver dentro do raio de algum local, libera
        if (dist <= local.raio) {
            localValido = true;
            console.log(`Ponto aceito em: ${local.nome} (Distância: ${Math.round(dist)}m)`);
            break; 
        }
    }

    // 3. TRAVA DE LOCALIZAÇÃO (Se não estiver perto de nenhum)
    if (!localValido) {
        return NextResponse.json({ 
            success: false, 
            message: `Bloqueado! Você está a ${Math.round(menorDistancia)}m do local mais próximo (${localProximo}). Aproxime-se.` 
        }, { status: 403 });
    }

    // Pega IP apenas para registro histórico (não bloqueia mais por IP)
    let ip = request.headers.get("x-forwarded-for") || "::1";
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");

    try {
        // Salva no Banco de Dados
        const novoPonto = await prisma.ponto.create({
            data: {
                tipo: tipo,
                ip: ip, 
                usuarioId: parseInt(usuarioId) // Mantém a conversão que você já usava
            }
        });

        return NextResponse.json({ success: true, message: "Ponto registrado com sucesso!", registro: novoPonto });

    } catch (error) {
        console.error("Erro ao registrar ponto:", error);
        return NextResponse.json({ success: false, message: "Erro ao salvar no banco de dados." }, { status: 500 });
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