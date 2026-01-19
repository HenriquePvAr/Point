import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        // Recebe os dados do formulário (agora esperando email)
        const body = await request.json();
        const { email, senha } = body;

        // Validação básica se o email veio vazio
        if (!email || !senha) {
             return NextResponse.json({ success: false, message: "Preencha e-mail e senha." }, { status: 400 });
        }

        // 1. BUSCA USUÁRIO NO BANCO PELO EMAIL
        // Nota: O campo 'email' precisa ser @unique no seu schema.prisma
        const user = await prisma.usuario.findUnique({
            where: { email: email }
        });

        // 2. VERIFICA SE O USUÁRIO EXISTE E SE A SENHA ESTÁ CORRETA
        if (!user || user.senha !== senha) {
            return NextResponse.json({ success: false, message: "E-mail ou senha incorretos." }, { status: 401 });
        }

        // 3. VERIFICA SE O USUÁRIO ESTÁ ATIVO
        if (user.status === 'inativo') {
            return NextResponse.json({ success: false, message: "Seu acesso foi desativado pelo administrador." }, { status: 403 });
        }

        // 4. LOGIN SUCESSO: Retorna os dados necessários para o Front-end
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