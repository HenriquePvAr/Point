import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ==================================================================
// 1. LISTAR USUÁRIOS (GET)
// ==================================================================
export async function GET() {
    try {
        const usuarios = await prisma.usuario.findMany({
            orderBy: { nome: 'asc' }
        });
        
        // Remove a senha antes de enviar para o front (segurança)
        const seguros = usuarios.map(({ senha, ...resto }) => resto);
        
        return NextResponse.json(seguros);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
    }
}

// ==================================================================
// 2. CRIAR USUÁRIO (POST)
// ==================================================================
export async function POST(request) {
    try {
        const body = await request.json();
        
        // Validação simples
        if (!body.nome || !body.email) {
            return NextResponse.json({ success: false, message: "Nome e Email são obrigatórios." }, { status: 400 });
        }

        // Como removemos o campo CPF do formulário, geramos um aleatório
        // para satisfazer a regra do banco de dados (@unique)
        const cpfAleatorio = Math.floor(Math.random() * 100000000000).toString();

        // Verifica se o EMAIL já existe
        const existe = await prisma.usuario.findUnique({
            where: { email: body.email }
        });

        if (existe) {
            return NextResponse.json({ success: false, message: "E-mail já cadastrado." }, { status: 400 });
        }

        // Criação no Banco
        const novoUsuario = await prisma.usuario.create({
            data: {
                nome: body.nome,
                email: body.email,
                cargo: body.cargo,
                cpf: cpfAleatorio, // CPF gerado automaticamente
                senha: "123",      // Senha padrão
                tipo: "funcionario",
                status: "ativo"
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

        // Verifica ID
        if (!body.id) {
            return NextResponse.json({ success: false, message: "ID necessário." }, { status: 400 });
        }

        let dadosParaAtualizar = {};

        // CENÁRIO A: Edição de Perfil (Nome, Email, Cargo)
        if (body.acao === 'editar') {
            dadosParaAtualizar = {
                nome: body.nome,
                email: body.email,
                cargo: body.cargo
            };
        } 
        // CENÁRIO B: Alteração de Status (Bloquear/Desbloquear)
        else if (body.status) {
            dadosParaAtualizar = {
                status: body.status
            };
        }
        // CENÁRIO C: Edição Genérica
        else {
             dadosParaAtualizar = {
                nome: body.nome,
                email: body.email,
                cargo: body.cargo,
                status: body.status
            };
        }

        // Remove campos undefined/null para não apagar dados sem querer
        Object.keys(dadosParaAtualizar).forEach(key => 
            dadosParaAtualizar[key] === undefined && delete dadosParaAtualizar[key]
        );

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

        // Deleta primeiro os registros dependentes (opcional se tiver cascade no schema, mas seguro por código)
        // O Prisma com onDelete: Cascade no schema já resolve, mas aqui garante.
        await prisma.usuario.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true, message: "Usuário excluído." });

    } catch (error) {
        console.error("Erro ao deletar:", error);
        return NextResponse.json({ success: false, message: "Erro ao excluir." }, { status: 500 });
    }
}