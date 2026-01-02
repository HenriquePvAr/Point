import { NextResponse } from 'next/server';

// Banco de dados em memória para as justificativas
if (!global.mensagens) global.mensagens = [];

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Se passar userId, filtra. Se não, retorna tudo (para o admin)
    if (userId) {
        return NextResponse.json(global.mensagens.filter(m => m.usuarioId == userId));
    }
    return NextResponse.json(global.mensagens);
}

export async function POST(request) {
    const { usuarioId, dataIso, texto } = await request.json();
    
    // Remove mensagem anterior desse dia (se houver) para atualizar
    global.mensagens = global.mensagens.filter(m => !(m.usuarioId == usuarioId && m.dataIso === dataIso));
    
    // Se tiver texto, salva a nova
    if (texto && texto.trim() !== "") {
        global.mensagens.push({ usuarioId, dataIso, texto });
    }
    
    return NextResponse.json({ success: true });
}