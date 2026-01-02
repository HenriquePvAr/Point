import { NextResponse } from 'next/server';

// Banco de dados em memória (reseta se reiniciar o servidor)
let pontos = global.pontos || [];
if (!global.pontos) global.pontos = pontos;

// IPs PERMITIDOS (Adicionei ::1 e 127.0.0.1 para você testar aí)
const IPS_PERMITIDOS = ["::1", "127.0.0.1", "45.236.9.18"];

export async function POST(request) {
    // Tenta pegar o IP real
    let ip = request.headers.get("x-forwarded-for") || "::1";
    if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
    
    // Se não identificar, assume local para não travar seu teste
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
    
    const novoPonto = {
        id: pontos.length + 1,
        ...body,
        data: new Date().toISOString(),
        ip
    };

    pontos.push(novoPonto);

    return NextResponse.json({ success: true, message: "Ponto registrado!", registro: novoPonto });
}

export async function GET(request) {
    // Busca histórico filtrado pelo ID do usuário
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const historico = pontos.filter(p => p.usuarioId == userId).reverse();
    return NextResponse.json(historico);
}