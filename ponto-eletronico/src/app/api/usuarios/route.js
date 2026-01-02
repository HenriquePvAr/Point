import { NextResponse } from 'next/server';

// Garante que usa o mesmo banco global
if (!global.usuarios) global.usuarios = [];

export async function GET() {
    // Retorna apenas funcionários (esconde o admin da lista se quiser)
    const lista = global.usuarios.filter(u => u.tipo !== 'admin');
    return NextResponse.json(lista);
}

export async function POST(request) {
    const body = await request.json();
    
    // Verifica se CPF já existe
    const existe = global.usuarios.find(u => u.cpf === body.cpf);
    if (existe) {
        return NextResponse.json({ success: false, message: "CPF já cadastrado." }, { status: 400 });
    }

    const novoUsuario = {
        id: Date.now(), // ID único baseado no tempo
        nome: body.nome,
        cpf: body.cpf,
        cargo: body.cargo,
        senha: "pinguim", // SENHA PADRÃO
        primeiroAcesso: true, // OBRIGA TROCAR SENHA
        status: "ativo",
        tipo: "funcionario"
    };

    global.usuarios.push(novoUsuario);
    return NextResponse.json({ success: true, usuario: novoUsuario });
}