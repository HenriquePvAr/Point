import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; 

// === CONFIGURAÇÃO DOS LOCAIS PERMITIDOS (GEOLOCALIZAÇÃO) ===
const LOCAIS_PERMITIDOS = [
    { 
        nome: "Pinguim", 
        lat: -3.0247373191862885, 
        lon: -60.00115033251761, 
        raio: 100 // Raio de tolerância em metros
    },
    { 
        nome: "Censipam", 
        lat: -3.022780933499939, 
        lon: -60.05511752323518, 
        raio: 100 // Raio de tolerância em metros
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

    // 1. VALIDAÇÃO DE GPS
    if (!latitude || !longitude) {
        return NextResponse.json({ 
            success: false, 
            message: "Localização não recebida. Ative o GPS." 
        }, { status: 400 });
    }

    console.log(`Tentativa de ponto (${tipo}) em: ${latitude}, ${longitude}`);

    // 2. TRAVA ANTI-DUPLICAÇÃO (SEGURANÇA)
    // Busca o último ponto registrado por este usuário
    try {
        const ultimoPonto = await prisma.ponto.findFirst({
            where: { usuarioId: parseInt(usuarioId) },
            orderBy: { data: 'desc' }
        });

        if (ultimoPonto) {
            const agora = new Date();
            const tempoUltimoPonto = new Date(ultimoPonto.data);
            const diferenca = agora - tempoUltimoPonto; // Diferença em milissegundos

            // Se faz menos de 60 segundos (60000ms) que bateu o ponto, bloqueia
            if (diferenca < 60000) { 
                return NextResponse.json({ 
                    success: false, 
                    message: "Você acabou de registrar um ponto! Aguarde 1 minuto." 
                }, { status: 429 }); // 429 = Too Many Requests
            }
        }
    } catch (error) {
        console.error("Erro ao verificar último ponto:", error);
        // Não retorna erro aqui para não travar o sistema se o banco oscilar na leitura,
        // mas é bom ficar atento aos logs.
    }

    // 3. CÁLCULO DA DISTÂNCIA (GEOFENCE)
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

    // 4. BLOQUEIO SE ESTIVER LONGE
    if (!localValido) {
        return NextResponse.json({ 
            success: false, 
            message: `Bloqueado! Você está a ${Math.round(menorDistancia)}m do local mais próximo (${localProximo}). Aproxime-se.` 
        }, { status: 403 });
    }

    // Pega IP para registro
    let ip = request.headers.get("x-forwarded-for") || "::1";
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");

    try {
        // 5. TRANSAÇÃO: SALVA PONTO + NOTIFICAÇÃO
        const [novoPonto, novaNotificacao] = await prisma.$transaction([
            // Cria o registro oficial
            prisma.ponto.create({
                data: {
                    tipo: tipo,
                    ip: ip, 
                    usuarioId: parseInt(usuarioId)
                }
            }),
            // Cria o aviso para o Admin
            prisma.notificacao.create({
                data: {
                    tipo: tipo,
                    usuarioId: parseInt(usuarioId)
                }
            })
        ]);

        return NextResponse.json({ 
            success: true, 
            message: "Ponto registrado com sucesso!", 
            registro: novoPonto 
        });

    } catch (error) {
        console.error("Erro ao salvar no banco:", error);
        return NextResponse.json({ success: false, message: "Erro interno ao salvar." }, { status: 500 });
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