import { NextResponse } from 'next/server';

// Banco de dados simulado (agora com E-MAIL)
if (!global.usuarios) {
    global.usuarios = [
        { id: 1, nome: "Henrique Paiva", cpf: "07253084276", email: "henrique@teste.com", senha: "123", cargo: "Analista de TI", status: "ativo", primeiroAcesso: false, tipo: "funcionario" },
        { id: 999, nome: "Administrador", cpf: "admin", email: "admin@sistema.com", senha: "123", cargo: "Gestor", status: "ativo", primeiroAcesso: false, tipo: "admin" }
    ];
}

export async function GET() {
    // Retorna lista sem a senha
    const lista = global.usuarios.map(({ senha, ...resto }) => resto);
    return NextResponse.json(lista);
}

export async function POST(request) {
    const body = await request.json();
    if (global.usuarios.find(u => u.cpf === body.cpf)) {
        return NextResponse.json({ success: false, message: "CPF já existe." }, { status: 400 });
    }
    // Adiciona usuário novo (com e-mail vazio se não vier)
    const novo = { id: Date.now(), ...body, senha: "pinguim", primeiroAcesso: true, status: "ativo", tipo: "funcionario" };
    global.usuarios.push(novo);
    return NextResponse.json({ success: true, usuario: novo });
}

// NOVA FUNÇÃO: EDITAR USUÁRIO
export async function PUT(request) {
    const body = await request.json();
    const index = global.usuarios.findIndex(u => u.id === body.id);

    if (index === -1) return NextResponse.json({ success: false, message: "Usuário não encontrado." }, { status: 404 });

    // Atualiza apenas os campos enviados
    global.usuarios[index] = { ...global.usuarios[index], ...body };
    
    return NextResponse.json({ success: true, usuario: global.usuarios[index] });
}