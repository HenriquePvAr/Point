import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode("PINGUIM_POINT_SECRET_KEY_2026");
const SUPER_ADMIN_EMAIL = "henriquepaiva128@gmail.com";

export async function GET() {
  const token = cookies().get("session_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);

    // pega email/role mesmo se teu payload estiver aninhado
    const email = String(payload?.email || payload?.user?.email || "").toLowerCase();
    const role = String(payload?.role || payload?.user?.role || "");
    const tipo = String(payload?.tipo || payload?.user?.tipo || "");

    const isSuperAdmin =
      email === SUPER_ADMIN_EMAIL.toLowerCase() || role === "SUPER_ADMIN" || tipo === "super_admin";

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
    }

    const empresas = await prisma.usuario.findMany({
      where: {
        OR: [
          { tipo: "admin" },
          { role: "ADMIN" },
        ],
      },
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
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
