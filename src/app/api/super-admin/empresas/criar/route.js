import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { nomeEmpresa, cnpj, nomeAdmin, email, senha } = body;

    // Validação simples
    if (!nomeEmpresa || !nomeAdmin || !email || !senha) {
      return NextResponse.json({ success: false, message: "Preencha os campos obrigatórios." }, { status: 400 });
    }

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Criar a Empresa
      const novaEmpresa = await tx.empresa.create({
        data: {
          nome: nomeEmpresa,
          cnpj: cnpj || null,
          ativo: true,
          plano: "mensal",
        }
      });

      // 2. Criar o Usuário Admin daquela empresa
      const novoUsuario = await tx.usuario.create({
        data: {
          nome: nomeAdmin,
          email: email,
          senha: hashedPassword,
          cpf: "000.000.000-00", // CPF padrão para preencher depois
          role: "ADMIN",
          empresaId: novaEmpresa.id,
          primeiroAcesso: false
        }
      });

      return { novaEmpresa, novoUsuario };
    });

    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    console.error("Erro ao criar empresa via Super Admin:", error);
    return NextResponse.json({ success: false, message: "Erro ao criar empresa." }, { status: 500 });
  }
}