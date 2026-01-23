import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// =================================================================================
// CONFIGURAÇÃO DE SEGURANÇA E LOCAIS
// =================================================================================

// Lista de Locais Permitidos (Geofence)
// TODO: No futuro, você pode mover isso para o banco de dados (model Empresa) para cada cliente ter o seu.
const LOCAIS_PERMITIDOS = [
    { 
        nome: "Pinguim", 
        lat: -3.0247373191862885, 
        lon: -60.00115033251761, 
        raio: 100 // Metros
    },
    { 
        nome: "Censipam", 
        lat: -3.022780933499939, 
        lon: -60.05511752323518, 
        raio: 100 // Metros
    }
];

// Função Auxiliar: Calcula distância entre dois pontos (Haversine)
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

    return R * c;
}

// Função Auxiliar: Verifica se a empresa está pagando (Bloqueio SaaS)
async function verificarStatusEmpresa(usuarioId) {
    if (!usuarioId) return { bloqueado: false }; // Deixa o erro de 'sem id' para a validação principal

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: parseInt(usuarioId) },
            include: { empresa: true }
        });

        if (!usuario) return { bloqueado: true, motivo: "Usuário não encontrado." };
        if (!usuario.empresa) return { bloqueado: true, motivo: "Empresa não vinculada." };

        // 1. Super Admin (Você) nunca é bloqueado
        if (usuario.role === 'SUPER_ADMIN') return { bloqueado: false };

        // 2. Verifica se está ativa e se o pagamento está em dia
        const hoje = new Date();
        const validade = usuario.empresa.pagoAte ? new Date(usuario.empresa.pagoAte) : null;
        
        // Regra: Bloqueia se 'ativo' for false OU se a data de validade já passou
        const estaVencido = validade && validade < hoje;

        if (!usuario.empresa.ativo || estaVencido) {
            return { 
                bloqueado: true, 
                motivo: "Acesso bloqueado. A assinatura da empresa está pendente ou expirada." 
            };
        }

        return { bloqueado: false };
    } catch (error) {
        console.error("Erro ao verificar status da empresa:", error);
        return { bloqueado: true, motivo: "Erro interno ao verificar permissões." };
    }
}

// =================================================================================
// 1. REGISTRAR PONTO (POST)
// =================================================================================
export async function POST(request) {
    const body = await request.json();
    const { latitude, longitude, usuarioId, tipo, modoAdmin, dataManual } = body;

    // --- [NOVO] TRAVA FINANCEIRA (SAAS) ---
    // Antes de qualquer coisa, verifica se a empresa pagou.
    const statusEmpresa = await verificarStatusEmpresa(usuarioId);
    if (statusEmpresa.bloqueado) {
        return NextResponse.json({ 
            success: false, 
            message: statusEmpresa.motivo 
        }, { status: 403 });
    }
    // --------------------------------------

    // =================================================================================
    // CAMINHO A: MODO ADMIN (Inserção/Correção Manual)
    // =================================================================================
    if (modoAdmin) {
        try {
            console.log(`[Admin] Inserindo ponto manual para ID: ${usuarioId}`);
            
            const novoPonto = await prisma.ponto.create({
                data: {
                    tipo: tipo,
                    ip: "Manual (Admin)", 
                    usuarioId: parseInt(usuarioId),
                    // Se o admin passou uma data específica, usa ela. Senão, 'agora'.
                    data: dataManual ? new Date(dataManual) : new Date() 
                }
            });
            
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
    // CAMINHO B: MODO FUNCIONÁRIO (Fluxo Normal com GPS)
    // =================================================================================

    // 1. VALIDAÇÃO DE GPS
    if (!latitude || !longitude) {
        return NextResponse.json({ 
            success: false, 
            message: "Localização não recebida. Ative o GPS." 
        }, { status: 400 });
    }

    console.log(`Tentativa de ponto (${tipo}) em: ${latitude}, ${longitude}`);

    // 2. TRAVA ANTI-DUPLICAÇÃO (Anti-Spam de 1 min)
    try {
        const ultimoPonto = await prisma.ponto.findFirst({
            where: { usuarioId: parseInt(usuarioId) },
            orderBy: { data: 'desc' }
        });

        if (ultimoPonto) {
            const agora = new Date();
            const tempoUltimoPonto = new Date(ultimoPonto.data);
            const diferenca = agora - tempoUltimoPonto; // ms

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

    // Pega IP para auditoria
    let ip = request.headers.get("x-forwarded-for") || "::1";
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");

    try {
        // 5. TRANSAÇÃO: SALVA PONTO + NOTIFICAÇÃO
        const [novoPonto, novaNotificacao] = await prisma.$transaction([
            prisma.ponto.create({
                data: {
                    tipo: tipo,
                    ip: ip, 
                    usuarioId: parseInt(usuarioId)
                }
            }),
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

// =================================================================================
// 2. LISTAR PONTOS (GET)
// =================================================================================
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const mes = searchParams.get('mes');
    const ano = searchParams.get('ano');

    try {
        if (!userId) return NextResponse.json([]);

        // Configura filtro de data
        let filtroData = {};
        if (mes !== null && ano !== null) {
            const dataInicio = new Date(parseInt(ano), parseInt(mes), 1);
            const dataFim = new Date(parseInt(ano), parseInt(mes) + 1, 0, 23, 59, 59);
            filtroData = { gte: dataInicio, lte: dataFim };
        }

        // Busca histórico
        const historico = await prisma.ponto.findMany({
            where: {
                usuarioId: parseInt(userId),
                ...(mes !== null && ano !== null ? { data: filtroData } : {})
            },
            orderBy: { data: 'desc' }
        });
        
        return NextResponse.json(historico);

    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        return NextResponse.json([]);
    }
}

// =================================================================================
// 3. ATUALIZAR PONTO (PUT) - Correção pelo Admin
// =================================================================================
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, novaData, novoTipo } = body;

        // Opcional: Adicionar verificação de permissão da empresa aqui também
        // (Isso exigiria buscar o usuarioId do ponto antes de atualizar)
        
        await prisma.ponto.update({
            where: { id: parseInt(id) },
            data: {
                data: new Date(novaData),
                tipo: novoTipo
            }
        });

        return NextResponse.json({ success: true, message: "Registro atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar ponto:", error);
        return NextResponse.json({ success: false, message: "Erro ao atualizar registro." }, { status: 500 });
    }
}

// =================================================================================
// 4. EXCLUIR PONTO (DELETE)
// =================================================================================
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