import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });

  // Apaga o cookie da sessão (funciona mesmo se for HttpOnly)
  res.cookies.set({
    name: "session_token",
    value: "",
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
