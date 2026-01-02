import { NextResponse } from 'next/server';

export async function POST(request) {
    const { usuarioId, novaSenha } = await request.json();

    // Encontra o usuário na memória global
    const index = global.usuarios.findIndex(u => u.id === usuarioId);

    if (index === -1) {
        return NextResponse.json({ success: false, message: "Usuário não encontrado." }, { status: 404 });
    }

    // Atualiza a senha e remove a flag de primeiro acesso
    global.usuarios[index].senha = novaSenha;
    global.usuarios[index].primeiroAcesso = false;

    return NextResponse.json({ success: true, message: "Senha alterada com sucesso!" });
}