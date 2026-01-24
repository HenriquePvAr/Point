import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { nomeEmpresa, cnpj, nomeUsuario, email, cpf, senha } = body;

    // 1. Validação básica
    if (!nomeEmpresa || !nomeUsuario || !email || !senha) {
      return NextResponse.json({ success: false, message: "Campos obrigatórios faltando." }, { status: 400 });
    }

    // 2. Criar tudo em uma transação (ou cria ambos ou nenhum)
    const resultado = await prisma.$transaction(async (tx) => {
      // Cria a Empresa
      const novaEmpresa = await tx.empresa.create({
        data: {
          nome: nomeEmpresa,
          cnpj: cnpj || null,
          ativo: true,
          plano: "mensal",
        }
      });

      // Cria o Usuário Admin
      const hashedPassword = await bcrypt.hash(senha, 10);
      const novoUsuario = await tx.usuario.create({
        data: {
          nome: nomeUsuario,
          email: email,
          cpf: cpf || "000.000.000-00",
          senha: hashedPassword,
          role: "ADMIN",
          empresaId: novaEmpresa.id,
          primeiroAcesso: false
        }
      });

      return { novaEmpresa, novoUsuario };
    });

    return NextResponse.json({ success: true, message: "Empresa e Admin criados!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Erro ao cadastrar empresa." }, { status: 500 });
  }
}