import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// === LISTA DE IPS PERMITIDOS ===
  // === LISTA DE IPS PERMITIDOS (TRAVA ATIVA) ===
// === LISTA DE IPS PERMITIDOS (TRAVA ATIVA) ===
const IPS_PERMITIDOS = [
    "193.186.4.241", // IP da empresa 1
    "191.26.135.146" // IP da empresa 2 20'     // <-- COLOQUE O IP DA EMPRESA AQUI
];

export async function POST(request) {
    try {
        // 1. CAPTURA O IP DE QUEM ESTÁ ACESSANDO
        const ipOriginal = request.headers.get('x-forwarded-for') || 
                           request.headers.get('x-real-ip') || 
                           'ip-desconhecido';
        
        // Limpa o IP (alguns provedores mandam uma lista de IPs separados por vírgula)
        const ipCliente = ipOriginal.split(',')[0].trim();

        console.log(`Tentativa de login pelo IP: ${ipCliente}`);

        // 2. VERIFICA SE O IP ESTÁ NA LISTA
        // Se o seu IP mudar (IP Dinâmico), você precisará atualizar essa lista.
        if (!IPS_PERMITIDOS.includes(ipCliente)) {
            console.log("❌ ACESSO BLOQUEADO: IP não autorizado.");
            return NextResponse.json({ 
                success: false, 
                message: "Acesso bloqueado: Este sistema só pode ser acessado na rede da empresa." 
            }, { status: 403 });
        }

        const body = await request.json();
        const { cpf, senha } = body;

        // 3. BUSCA USUÁRIO NO BANCO
        const user = await prisma.usuario.findUnique({
            where: { cpf: cpf }
        });

        if (!user || user.senha !== senha) {
            return NextResponse.json({ success: false, message: "CPF ou senha incorretos." }, { status: 401 });
        }

        // Se o usuário estiver inativo no banco
        if (user.status === 'inativo') {
            return NextResponse.json({ success: false, message: "Seu acesso foi desativado pelo administrador." }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                nome: user.nome,
                tipo: user.tipo,
                primeiroAcesso: user.primeiroAcesso
            }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        return NextResponse.json({ success: false, message: "Erro no servidor." }, { status: 500 });
    }
}