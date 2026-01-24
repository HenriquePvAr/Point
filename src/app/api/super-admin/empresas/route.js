import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// ✅ evita cache nessa rota (super admin precisa sempre atualizado)
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SECRET_KEY = new TextEncoder().encode("PINGUIM_POINT_SECRET_KEY_2026");
const SUPER_ADMIN_EMAIL = "henriquepaiva128@gmail.com";

export async function GET() {
  // 1) Segurança: verificar sessão
  const token = cookies().get("session_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // 2) Validar JWT
    const { payload } = await jwtVerify(token, SECRET_KEY);

    const email = String(payload?.email || "").toLowerCase();

    // 3) Garantir que só o super admin entra
    if (email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Acesso restrito ao Super Admin" },
        { status: 403 }
      );
    }

    // 4) Buscar todas as empresas (usuários tipo 'admin' = donos)
    const empresas = await prisma.usuario.findMany({
      where: { tipo: "admin" },
      select: {
        id: true,
        nome: true,
        email: true,
        statusAssinatura: true,
        stripeCustomerId: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: "desc" },
    });

    return NextResponse.json(empresas);
  } catch (e) {
    return NextResponse.json(
      { error: "Token inválido ou expirado" },
      { status: 401 }
    );
  }
}
