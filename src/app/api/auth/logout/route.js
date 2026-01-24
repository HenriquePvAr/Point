import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });

  // IMPORTANTE: precisa bater com o cookie que você setou no login (mesmo nome e path)
  res.cookies.set("session_token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
