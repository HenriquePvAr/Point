import { NextResponse } from 'next/server';
// CORREÇÃO: Importe o prisma do seu lib compartilhado, senão o banco trava por excesso de conexões
import prisma from '@/lib/prisma'; 

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
            console.log(`> Tentando buscar pelo ID: ${body.usuarioId}`);
            
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
            return NextResponse.json({ success: false, message: "Usuário não localizado ou código inválido." }, { status: 404 });
        }

        console.log(`✅ Usuário Encontrado: ${user.nome} (ID: ${user.id})`);
        console.log(`> Atualizando senha...`);

        // 5. ATUALIZAÇÃO
        await prisma.usuario.update({
            where: { id: user.id },
            data: { 
                senha: String(novaSenha).trim(),
                primeiroAcesso: false,
                codigoRecuperacao: null // Queima o código para não usar de novo
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