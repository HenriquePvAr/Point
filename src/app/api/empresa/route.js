import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: id }
    });
    return NextResponse.json(empresa);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar empresa" }, { status: 500 });
  }
}