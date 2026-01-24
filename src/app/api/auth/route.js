// src/app/api/auth/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase();

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado no .env");
}
if (!SUPER_ADMIN_EMAIL) {
  throw new Error("SUPER_ADMIN_EMAIL não configurado no .env");
}

const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

// =====================================================================
// 1. LOGIN (POST)
// =====================================================================
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, senha, lembreDeMim } = body;

    if (!email || !senha) {
      return NextResponse.json(
        { success: false, message: "Preencha e-mail e senha." },
        { status: 400 }
      );
    }

    const emailNorm = String(email).trim().toLowerCase();

    const user = await prisma.usuario.findUnique({
      where: { email: emailNorm },
      include: { empresa: true },
    });

    // ⚠️ você ainda está validando senha em texto puro:
    // Em produção: use bcrypt (hash) no lugar disso
    if (!user || user.senha !== senha) {
      return NextResponse.json(
        { success: false, message: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    if (user.status !== "ativo") {
      return NextResponse.json(
        { success: false, message: "Seu acesso foi desativado pelo administrador." },
        { status: 403 }
      );
    }

    // ==========================================================
    // ✅ REGRA MÁXIMA SUPER ADMIN (BACKEND)
    // Só esse e-mail pode ser SUPER_ADMIN
    // ==========================================================
    const isSuperEmail = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

    // Se alguém no banco tiver SUPER_ADMIN mas não for o email oficial → BLOQUEIA
    if (user.role === "SUPER_ADMIN" && !isSuperEmail) {
      return NextResponse.json(
        { success: false, message: "Acesso negado." },
        { status: 403 }
      );
    }

    // Se for o email oficial, força o role no banco
    let userFinal = user;
    if (isSuperEmail && user.role !== "SUPER_ADMIN") {
      userFinal = await prisma.usuario.update({
        where: { id: user.id },
        data: { role: "SUPER_ADMIN" },
        include: { empresa: true },
      });
    }

    // ==========================================================
    // 5. BLOQUEIO FINANCEIRO / SAAS (só para quem NÃO é super admin)
    // ==========================================================
    if (userFinal.role !== "SUPER_ADMIN") {
      if (!userFinal.empresa) {
        return NextResponse.json(
          { success: false, message: "Usuário sem empresa vinculada." },
          { status: 403 }
        );
      }

      if (!userFinal.empresa.ativo) {
        return NextResponse.json(
          { success: false, message: "O acesso da sua empresa está suspenso." },
          { status: 403 }
        );
      }

      const hoje = new Date();
      const vencimento = userFinal.empresa.pagoAte ? new Date(userFinal.empresa.pagoAte) : null;

      if (vencimento && vencimento < hoje) {
        return NextResponse.json(
          { success: false, message: "Assinatura da empresa expirada. Contate o suporte." },
          { status: 403 }
        );
      }
    }

    // ==========================================================
    // 6. GERA JWT
    // ==========================================================
    const token = await new SignJWT({
      sub: userFinal.id.toString(),
      email: userFinal.email,
      role: userFinal.role,
      empresaId: userFinal.empresaId,
      nome: userFinal.nome,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(lembreDeMim ? "30d" : "24h")
      .sign(SECRET_KEY);

    cookies().set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: lembreDeMim ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
      path: "/",
    });

    const { senha: _, ...userSemSenha } = userFinal;

    return NextResponse.json({
      success: true,
      user: userSemSenha,
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

// =====================================================================
// 2. VERIFICAR SESSÃO (GET)
// =====================================================================
export async function GET() {
  const token = cookies().get("session_token")?.value;

  if (!token) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);

    const user = await prisma.usuario.findUnique({
      where: { id: parseInt(payload.sub) },
      include: { empresa: true },
    });

    if (!user) return NextResponse.json({ success: false }, { status: 401 });

    if (user.status !== "ativo") {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    // ✅ mesma regra máxima aqui
    const isSuperEmail = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

    if (user.role === "SUPER_ADMIN" && !isSuperEmail) {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    // (Opcional) se for o email do super admin e o role não estiver correto, corrige
    let userFinal = user;
    if (isSuperEmail && user.role !== "SUPER_ADMIN") {
      userFinal = await prisma.usuario.update({
        where: { id: user.id },
        data: { role: "SUPER_ADMIN" },
        include: { empresa: true },
      });
    }

    // Revalida SaaS só para não-super
    if (userFinal.role !== "SUPER_ADMIN") {
      if (!userFinal.empresa || !userFinal.empresa.ativo) {
        return NextResponse.json({ success: false }, { status: 403 });
      }
    }

    const { senha: _, ...userSemSenha } = userFinal;

    return NextResponse.json({
      success: true,
      user: userSemSenha,
    });
  } catch {
    return NextResponse.json({ success: false }, { status: 401 });
  }
}

// =====================================================================
// 3. LOGOUT (DELETE)
// =====================================================================
export async function DELETE() {
  cookies().delete("session_token");
  return NextResponse.json({ success: true });
}
