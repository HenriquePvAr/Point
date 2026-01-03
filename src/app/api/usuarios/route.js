import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// LISTAR USUÁRIOS (GET)
export async function GET() {
    try {
        const usuarios = await prisma.usuario.findMany({
            orderBy: { nome: 'asc' }
        });
        const seguros = usuarios.map(({ senha, ...resto }) => resto);
        return NextResponse.json(seguros);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
    }
}

// CRIAR USUÁRIO (POST)
export async function POST(request) {
    try {
        const body = await request.json();
        
        console.log("Criando usuário:", body.nome); 

        // 1. Validação Básica
        if (!body.cpf) {
            return NextResponse.json({ success: false, message: "CPF é obrigatório." }, { status: 400 });
        }
        
        // Limpeza do CPF
        const cpfString = String(body.cpf);
        const cpfLimpo = cpfString.replace(/\D/g, "");

        // 2. Verifica se já existe
        const existe = await prisma.usuario.findFirst({
            where: { OR: [{ cpf: cpfLimpo }, { email: body.email }] }
        });

        if (existe) {
            return NextResponse.json({ success: false, message: "Usuário já cadastrado (CPF ou Email duplicado)." }, { status: 400 });
        }

        // 3. CRIAÇÃO COM SENHA PADRÃO "123"
        // O erro estava aqui: body.senha vinha vazio. Agora usamos || "123"
        const novoUsuario = await prisma.usuario.create({
            data: {
                nome: body.nome,
                cpf: cpfLimpo,
                email: body.email, 
                senha: body.senha || "123", // <--- CORREÇÃO AQUI
                cargo: body.cargo,
                tipo: body.tipo || "funcionario",
                status: "ativo"
            }
        });

        return NextResponse.json({ success: true, usuario: novoUsuario });

    } catch (error) {
        console.error("ERRO NO CADASTRO:", error);
        return NextResponse.json({ success: false, message: "Erro ao criar: " + error.message }, { status: 500 });
    }
}

// EDITAR/EXCLUIR (PUT)// EDITAR/EXCLUIR (PUT)
export async function PUT(request) {
    try {
        const body = await request.json();

        // CASO 1: EXCLUIR
        if (body.acao === 'excluir') {
            await prisma.usuario.delete({ where: { id: body.id } });
            return NextResponse.json({ success: true, message: "Usuário excluído!" });
        }

        // CASO 2: EDITAR (Correção aqui!)
        if (body.acao === 'editar') {
            // Criamos um objeto APENAS com o que pode ser mudado na tela de edição
            // Isso impede que a senha seja alterada acidentalmente
            const dadosParaAtualizar = {
                nome: body.nome,
                email: body.email,
                cargo: body.cargo,
                // Nota: NÃO incluímos 'senha' aqui. O Prisma vai manter a antiga.
            };

            await prisma.usuario.update({
                where: { id: body.id },
                data: dadosParaAtualizar
            });
            return NextResponse.json({ success: true, message: "Usuário atualizado!" });
        }
        
        // CASO 3: BLOQUEAR/DESBLOQUEAR
        if (body.status) {
             await prisma.usuario.update({
                where: { id: body.id },
                data: { status: body.status }
            });
            return NextResponse.json({ success: true });
        }

    } catch (error) {
        console.error("Erro no PUT:", error);
        return NextResponse.json({ success: false, message: "Erro na operação." }, { status: 500 });
    }
}