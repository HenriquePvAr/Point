import { NextResponse } from 'next/server';

// Garante o Banco de Dados Global
if (!global.usuarios) {
    global.usuarios = [
        { id: 1, nome: "Henrique Paiva", cpf: "07253084276", email: "henrique@teste.com", senha: "123", cargo: "Analista de TI", status: "ativo", primeiroAcesso: false, tipo: "funcionario" },
        { id: 999, nome: "Administrador", cpf: "admin", email: "admin@sistema.com", senha: "123", cargo: "Gestor", status: "ativo", primeiroAcesso: false, tipo: "admin" }
    ];
}

export async function POST(request) {
    const { cpf, senha } = await request.json();
    const cpfLimpo = cpf.replace(/\D/g, "") || cpf; 
    
    const user = global.usuarios.find(u => {
        const uCpfLimpo = u.cpf.replace(/\D/g, "") || u.cpf;
        return uCpfLimpo === cpfLimpo && u.senha === senha;
    });

    if (!user) {
        return NextResponse.json({ success: false, message: "Credenciais inválidas." }, { status: 401 });
    }

    // --- AQUI ESTÁ A REGRA DE BLOQUEIO ---
    if (user.status !== 'ativo') {
        return NextResponse.json({ success: false, message: "Login bloqueado. Contate o RH." }, { status: 403 });
    }

    const { senha: _, ...userSemSenha } = user;
    return NextResponse.json({ success: true, user: userSemSenha });
}