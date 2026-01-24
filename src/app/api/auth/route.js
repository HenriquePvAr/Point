import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs"; // Importante para ler as senhas criptografadas

const JWT_SECRET = process.env.JWT_SECRET || "PINGUIM_POINT_SECRET_KEY_2026";
// Defina seu email de Super Admin aqui ou no .env
const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || "seuemail@exemplo.com").toLowerCase();

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

    if (!user) {
        return NextResponse.json(
          { success: false, message: "E-mail ou senha incorretos." },
          { status: 401 }
        );
    }

    // ✅ VERIFICAÇÃO DE SENHA COM CRIPTOGRAFIA (BCRYPT)
    const senhaValida = await bcrypt.compare(senha, user.senha);
    
    if (!senhaValida) {
      return NextResponse.json(
        { success: false, message: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    // ==========================================================
    // ✅ REGRA MÁXIMA SUPER ADMIN
    // ==========================================================
    const isSuperEmail = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

    // Se alguém no banco tiver SUPER_ADMIN mas não for o email oficial → BLOQUEIA
    if (user.role === "SUPER_ADMIN" && !isSuperEmail) {
      return NextResponse.json(
        { success: false, message: "Acesso negado. Perfil não autorizado." },
        { status: 403 }
      );
    }

    // Se for o email oficial, força o role no banco para garantir acesso
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
      // Bloqueio de Status manual (botão bloquear empresa)
      if (userFinal.empresa && !userFinal.empresa.ativo) {
        return NextResponse.json(
          { success: false, message: "O acesso da sua empresa está suspenso." },
          { status: 403 }
        );
      }

      // Bloqueio por falta de pagamento (Data de vencimento)
      if (userFinal.empresa) {
          const hoje = new Date();
          const vencimento = userFinal.empresa.pagoAte ? new Date(userFinal.empresa.pagoAte) : null;

          // Se tiver vencimento e já passou de hoje
          if (vencimento && vencimento < hoje) {
            return NextResponse.json(
              { success: false, message: "Assinatura expirada. Contate o suporte." },
              { status: 403 }
            );
          }
      }
      
      // Bloqueio de status do funcionário individual
      if (user.status !== "ativo") {
        return NextResponse.json(
          { success: false, message: "Seu acesso foi desativado pelo administrador." },
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
      role: userFinal.role, // Aqui vai dizer se é ADMIN ou SUPER_ADMIN
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

    // ✅ Valida Super Admin novamente
    const isSuperEmail = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

    if (user.role === "SUPER_ADMIN" && !isSuperEmail) {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    // Corrige role se necessário
    let userFinal = user;
    if (isSuperEmail && user.role !== "SUPER_ADMIN") {
      userFinal = await prisma.usuario.update({
        where: { id: user.id },
        data: { role: "SUPER_ADMIN" },
        include: { empresa: true },
      });
    }

    // Revalida SaaS apenas se NÃO for Super Admin
    if (userFinal.role !== "SUPER_ADMIN") {
       // Se empresa bloqueada
       if (userFinal.empresa && !userFinal.empresa.ativo) {
         return NextResponse.json({ success: false }, { status: 403 });
       }
       // Se usuário inativo
       if (userFinal.status !== "ativo") {
         return NextResponse.json({ success: false }, { status: 403 });
       }
       // Nota: Não bloqueamos sessão ativa por "pagoAte" aqui para não expulsar
       // o usuário no meio do uso, mas pode descomentar se quiser rigor total.
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