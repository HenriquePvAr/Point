import { NextResponse } from 'next/server';

// --- BANCO DE DADOS GLOBAL (Simulado) ---
// Isso garante que os usuários criados no Admin funcionem aqui
if (!global.usuarios) {
    global.usuarios = [
        { id: 1, nome: "Henrique Paiva", cpf: "07253084276", senha: "123", cargo: "Analista de TI", status: "ativo", primeiroAcesso: false, tipo: "funcionario" },
        // USUÁRIO ADMIN PADRÃO
        { id: 999, nome: "Administrador", cpf: "admin", senha: "123", cargo: "Gestor", status: "ativo", primeiroAcesso: false, tipo: "admin" }
    ];
}

export async function POST(request) {
    const { cpf, senha } = await request.json();

    // Procura usuário (agora aceita "admin" no campo CPF)
    // Remove pontos e traços do CPF se vierem formatados
    const cpfLimpo = cpf.replace(/\D/g, "") || cpf; 
    
    const user = global.usuarios.find(u => {
        const uCpfLimpo = u.cpf.replace(/\D/g, "") || u.cpf;
        return uCpfLimpo === cpfLimpo && u.senha === senha;
    });

    if (!user) {
        return NextResponse.json({ success: false, message: "Credenciais inválidas." }, { status: 401 });
    }

    if (user.status !== 'ativo') {
        return NextResponse.json({ success: false, message: "Acesso desativado. Contate o RH." }, { status: 403 });
    }

    // Retorna dados seguros (sem a senha)
    const { senha: _, ...userSemSenha } = user;
    return NextResponse.json({ success: true, user: userSemSenha });
}