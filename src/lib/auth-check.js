// src/lib/auth-check.js
import { prisma } from "@/lib/prisma";

export async function verificarPermissaoEmpresa(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { empresa: true }
  });

  if (!usuario) throw new Error("Usuário não encontrado");

  // Regra do Super Admin (Você) - Acesso irrestrito
  if (usuario.role === 'SUPER_ADMIN') return true;

  // Verifica se a empresa está ativa e se o pagamento está em dia
  const hoje = new Date();
  const dataVencimento = usuario.empresa.pagoAte ? new Date(usuario.empresa.pagoAte) : null;
  
  // Lógica: Se estiver inativa OU (se tiver data de vencimento e já passou)
  const estaVencido = dataVencimento && dataVencimento < hoje;

  if (!usuario.empresa.ativo || estaVencido) {
    return {
      bloqueado: true,
      motivo: "Sua assinatura expirou. Acesse o menu Financeiro para regularizar."
    };
  }

  return { bloqueado: false, empresaId: usuario.empresaId };
}