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

// 1. REGISTRAR PONTO (POST)
// Agora suporta modo normal (com GPS) e modo admin (sem GPS)
export async function POST(request) {
    const body = await request.json();
    const { latitude, longitude, usuarioId, tipo, modoAdmin, dataManual } = body;

    // =================================================================================
    // CAMINHO A: MODO ADMIN (Inserção/Correção Manual)
    // Se a flag modoAdmin vier true, pulamos as checagens de GPS e travas de tempo
    // =================================================================================
    if (modoAdmin) {
        try {
            console.log(`Admin inserindo ponto manual para ID: ${usuarioId}`);
            
            const novoPonto = await prisma.ponto.create({
                data: {
                    tipo: tipo,
                    ip: "Manual (Admin)", // Identifica que foi ajustado manualmente
                    usuarioId: parseInt(usuarioId),
                    // Se o admin passou uma data específica (dataManual), usa ela. Se não, usa Agora.
                    data: dataManual ? new Date(dataManual) : new Date() 
                }
            });

            // Opcional: Criar notificação ou log de auditoria aqui se desejar
            
            return NextResponse.json({ 
                success: true, 
                message: "Ponto manual adicionado com sucesso!", 
                registro: novoPonto 
            });
        } catch (error) {
            console.error("Erro ao adicionar manual:", error);
            return NextResponse.json({ success: false, message: "Erro ao criar registro manual." }, { status: 500 });
        }
    }

    // =================================================================================
    // CAMINHO B: MODO FUNCIONÁRIO (Fluxo Normal com Segurança)
    // Se não for admin, segue exatamente a lógica que você já tinha
    // =================================================================================

    // 1. VALIDAÇÃO DE GPS
    if (!latitude || !longitude) {
        return NextResponse.json({ 
            success: false, 
            message: "Localização não recebida. Ative o GPS." 
        }, { status: 400 });
    }

    console.log(`Tentativa de ponto (${tipo}) em: ${latitude}, ${longitude}`);

    // 2. TRAVA ANTI-DUPLICAÇÃO (SEGURANÇA)
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
                }, { status: 429 }); 
            }
        }
    } catch (error) {
        console.error("Erro ao verificar último ponto:", error);
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

// 2. LISTAR PONTOS (GET)
// Mantido igual ao original
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

// 3. ATUALIZAR PONTO (PUT) - NOVO
// Usado pelo botão de Lápis do Admin para corrigir horários ou tipos
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, novaData, novoTipo } = body;
        
        // Atualiza o registro no banco
        await prisma.ponto.update({
            where: { id: parseInt(id) },
            data: {
                data: new Date(novaData), // Atualiza para a nova data/hora combinada
                tipo: novoTipo
            }
        });

        return NextResponse.json({ success: true, message: "Registro atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar ponto:", error);
        return NextResponse.json({ success: false, message: "Erro ao atualizar registro." }, { status: 500 });
    }
}

// 4. EXCLUIR PONTO (DELETE) - NOVO
// Usado pelo botão de Lixeira do Admin para remover duplicados ou erros
export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ success: false, message: "ID não fornecido." }, { status: 400 });
    }

    try {
        await prisma.ponto.delete({
            where: { id: parseInt(id) }
        });
        return NextResponse.json({ success: true, message: "Registro excluído com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir ponto:", error);
        return NextResponse.json({ success: false, message: "Erro ao excluir registro." }, { status: 500 });
    }
}