import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma'; // Importa a conexão compartilhada (recomendado)

export async function POST(request) {
    try {
        // Recebe os dados do formulário de login
        const body = await request.json();
        const { cpf, senha } = body;

        // 1. BUSCA USUÁRIO NO BANCO PELO CPF
        const user = await prisma.usuario.findUnique({
            where: { cpf: cpf }
        });

        // 2. VERIFICA SE O USUÁRIO EXISTE E SE A SENHA ESTÁ CORRETA
        if (!user || user.senha !== senha) {
            return NextResponse.json({ success: false, message: "CPF ou senha incorretos." }, { status: 401 });
        }

        // 3. VERIFICA SE O USUÁRIO ESTÁ ATIVO
        if (user.status === 'inativo') {
            return NextResponse.json({ success: false, message: "Seu acesso foi desativado pelo administrador." }, { status: 403 });
        }

        // 4. LOGIN SUCESSO: Retorna os dados do usuário para o Front-end
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                nome: user.nome,
                tipo: user.tipo,
                primeiroAcesso: user.primeiroAcesso
            }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        return NextResponse.json({ success: false, message: "Erro interno no servidor." }, { status: 500 });
    }
}