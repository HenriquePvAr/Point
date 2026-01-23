import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ==================================================================
// 1. LISTAR USUÁRIOS (GET) - AGORA COM FILTRO DE EMPRESA
// ==================================================================
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');

    // Segurança SaaS: Se não mandar o ID da empresa, não lista ninguém
    // (A menos que você queira uma rota de Super Admin que vê tudo, mas por padrão bloqueamos)
    if (!empresaId) {
        return NextResponse.json({ error: "ID da empresa obrigatório." }, { status: 400 });
    }

    try {
        const usuarios = await prisma.usuario.findMany({
            where: {
                empresaId: empresaId
            },
            orderBy: { nome: 'asc' }
        });
        
        // Remove a senha antes de enviar para o front
        const seguros = usuarios.map(({ senha, ...resto }) => resto);
        
        return NextResponse.json(seguros);
    } catch (error) {
        console.error("Erro no GET usuarios:", error);
        return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
    }
}

// ==================================================================
// 2. CRIAR USUÁRIO (POST)
// ==================================================================
export async function POST(request) {
    try {
        const body = await request.json();
        const { nome, email, cpf, senha, empresaId, role, cargo } = body;
        
        // Validação básica
        if (!nome || !email || !empresaId) {
            return NextResponse.json({ success: false, message: "Nome, Email e Empresa são obrigatórios." }, { status: 400 });
        }

        // Verifica duplicidade (Email ou CPF)
        const existe = await prisma.usuario.findFirst({
            where: { 
                OR: [
                    { email: email },
                    { cpf: cpf || undefined } // Checa CPF apenas se foi enviado
                ]
            }
        });

        if (existe) {
            return NextResponse.json({ success: false, message: "E-mail ou CPF já cadastrado no sistema." }, { status: 400 });
        }

        // Tratamento do CPF (Se não vier do front, gera um provisório para não quebrar o banco)
        // Idealmente, o front deve passar o CPF real agora.
        const cpfFinal = cpf || Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 9999).toString();

        // Tratamento do Role (Cargo)
        // Se o front mandar 'cargo', tentamos mapear, senão usa 'FUNCIONARIO'
        let roleFinal = role;
        if (!roleFinal) {
            // Fallback para compatibilidade se o front ainda enviar "cargo" antigo
            if (cargo === 'admin') roleFinal = 'ADMIN';
            else roleFinal = 'FUNCIONARIO';
        }

        // Criação no Banco
        const novoUsuario = await prisma.usuario.create({
            data: {
                nome,
                email,
                cpf: cpfFinal,
                senha: senha || "123", // Senha padrão se não enviada
                role: roleFinal,       // Enum: 'ADMIN', 'FUNCIONARIO'
                status: "ativo",
                primeiroAcesso: true,
                empresaId: empresaId   // OBRIGATÓRIO: Vincula à empresa
            }
        });

        return NextResponse.json({ success: true, usuario: novoUsuario });

    } catch (error) {
        console.error("ERRO NO CADASTRO:", error);
        return NextResponse.json({ success: false, message: "Erro ao criar usuário." }, { status: 500 });
    }
}

// ==================================================================
// 3. EDITAR USUÁRIO (PUT)
// ==================================================================
export async function PUT(request) {
    try {
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json({ success: false, message: "ID necessário." }, { status: 400 });
        }

        let dadosParaAtualizar = {};

        // Mapeia os dados recebidos para os campos corretos do Prisma
        if (body.nome) dadosParaAtualizar.nome = body.nome;
        if (body.email) dadosParaAtualizar.email = body.email;
        if (body.cpf) dadosParaAtualizar.cpf = body.cpf;
        
        // Atualiza Role (Cargo)
        if (body.role) dadosParaAtualizar.role = body.role;
        // Compatibilidade com front antigo
        if (body.cargo) {
            if (body.cargo === 'admin') dadosParaAtualizar.role = 'ADMIN';
            else dadosParaAtualizar.role = 'FUNCIONARIO';
        }

        // Atualiza Status
        if (body.status) dadosParaAtualizar.status = body.status;

        // Atualiza Senha (se fornecida)
        if (body.senha) dadosParaAtualizar.senha = body.senha;

        const usuarioAtualizado = await prisma.usuario.update({
            where: { id: parseInt(body.id) },
            data: dadosParaAtualizar
        });

        return NextResponse.json({ success: true, usuario: usuarioAtualizado });

    } catch (error) {
        console.error("Erro no PUT:", error);
        return NextResponse.json({ success: false, message: "Erro ao atualizar." }, { status: 500 });
    }
}

// ==================================================================
// 4. EXCLUIR USUÁRIO (DELETE)
// ==================================================================
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: "ID necessário." }, { status: 400 });
        }

        await prisma.usuario.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true, message: "Usuário excluído." });

    } catch (error) {
        console.error("Erro ao deletar:", error);
        return NextResponse.json({ success: false, message: "Erro ao excluir." }, { status: 500 });
    }
}