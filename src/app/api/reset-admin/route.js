import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Força a senha do ID 1 (Geralmente o Admin) para "123"
        // Se o seu Admin tiver outro ID, troque o número 1 abaixo
        const user = await prisma.usuario.update({
            where: { id: 1 }, 
            data: { senha: "123" }
        });

        return NextResponse.json({ 
            mensagem: "SUCESSO! Senha resetada na marra.", 
            usuario: user.nome, 
            novaSenha: user.senha 
        });
    } catch (error) {
        return NextResponse.json({ erro: error.message }, { status: 500 });
    }
}