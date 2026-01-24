import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        // 1. Digite AQUI o seu email de Super Admin exato
        const emailAlvo = "henriquepaiva128@gmail.com"; 

        // 2. Gera a hash segura para a senha "123456"
        const senhaForte = await bcrypt.hash("123456", 10);

        // 3. Atualiza no Banco
        const user = await prisma.usuario.update({
            where: { email: emailAlvo },
            data: {
                senha: senhaForte,      // Salva a senha criptografada
                tipo: "super_admin",    // Garante o cargo correto (campo antigo)
                role: "SUPER_ADMIN",    // Garante o cargo correto (campo novo)
                status: "ativo"         // Garante que não está bloqueado
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: "Senha resetada para 123456 e cargo definido como SUPER_ADMIN",
            user: user.email 
        });

    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            error: error.message,
            hint: "Verifique se o email no código está igual ao do banco de dados."
        });
    }
}