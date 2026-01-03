import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const body = await request.json();
        
        console.log("\n========================================");
        console.log("🕵️ INVESTIGAÇÃO DE TROCA DE SENHA");
        console.log("📦 O site mandou este pacote:", body);

        // 1. Verifica a Senha
        let novaSenha = body.novaSenha || body.senha;
        if (!novaSenha) {
            console.log("❌ ERRO: Nenhuma senha chegou.");
            return NextResponse.json({ success: false, message: "Senha vazia." }, { status: 400 });
        }

        let user = null;

        // 2. TENTATIVA 1: MODO PRIMEIRO ACESSO (Pelo ID)
        if (body.usuarioId !== undefined && body.usuarioId !== null) {
            console.log(`> Tentando buscar pelo ID: ${body.usuarioId} (Tipo: ${typeof body.usuarioId})`);
            
            // Lista todos os IDs do banco para a gente ver se existe
            const todosUsuarios = await prisma.usuario.findMany({ select: { id: true, nome: true } });
            console.log("📋 IDs EXISTENTES NO BANCO:", JSON.stringify(todosUsuarios));

            // Tenta achar convertendo para Número
            user = await prisma.usuario.findUnique({
                where: { id: Number(body.usuarioId) }
            });
        } 
        
        // 3. TENTATIVA 2: MODO ESQUECI SENHA (Pelo Email + Código)
        else if (body.email && body.codigo) {
            console.log(`> Tentando buscar pelo Email: ${body.email}`);
            user = await prisma.usuario.findFirst({
                where: { 
                    email: body.email, 
                    codigoRecuperacao: String(body.codigo).trim() 
                }
            });
        } else {
            console.log("❌ ERRO: O site não mandou nem ID, nem Email+Código.");
        }

        // 4. RESULTADO DA BUSCA
        if (!user) {
            console.log("❌ USUÁRIO NÃO ENCONTRADO NO BANCO!");
            return NextResponse.json({ success: false, message: "Usuário não localizado." }, { status: 404 });
        }

        console.log(`✅ Usuário Encontrado: ${user.nome} (ID: ${user.id})`);
        console.log(`> Atualizando senha...`);

        // 5. ATUALIZAÇÃO
        await prisma.usuario.update({
            where: { id: user.id },
            data: { 
                senha: String(novaSenha).trim(),
                primeiroAcesso: false,
                codigoRecuperacao: null
            }
        });

        console.log("✅ SENHA ALTERADA COM SUCESSO!");
        console.log("========================================\n");
        
        return NextResponse.json({ success: true, message: "Senha trocada!" });

    } catch (error) {
        console.error("❌ ERRO GRAVE:", error);
        return NextResponse.json({ success: false, message: "Erro no servidor: " + error.message }, { status: 500 });
    }
}