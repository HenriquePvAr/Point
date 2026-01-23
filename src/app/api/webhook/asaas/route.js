import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // <--- 1. SEM AS CHAVES { }

export async function POST(req) {
  try {
    const body = await req.json();

    // Log para depuração (opcional, ajuda a ver o que chega)
    console.log("Webhook Asaas Recebido:", body.event);

    if (body.event === "PAYMENT_RECEIVED" || body.event === "PAYMENT_CONFIRMED") {
      const asaasPaymentId = body.payment.id;
      const asaasCustomerId = body.payment.customer;
      const valor = body.payment.value;
      const dataPagamento = new Date(); // Data de hoje

      // 1. Tenta achar a EMPRESA pelo ID do Cliente Asaas
      // (Isso garante que funcione mesmo em renovações automáticas mensais)
      const empresa = await prisma.empresa.findFirst({
        where: { asaasCustomerId: asaasCustomerId }
      });

      if (!empresa) {
        console.error("❌ Empresa não encontrada para o cliente Asaas:", asaasCustomerId);
        return NextResponse.json({ received: true }); // Retorna 200 pro Asaas não ficar tentando de novo
      }

      console.log(`✅ Pagamento identificado para empresa: ${empresa.nome}`);

      // 2. Atualiza ou Cria o Registro do Pagamento no histórico
      // (Se já existir pelo ID do Asaas, atualiza. Se não, cria um novo.)
      const pagamentoExistente = await prisma.pagamento.findFirst({
         where: { asaasId: asaasPaymentId }
      });

      if (pagamentoExistente) {
         await prisma.pagamento.update({
            where: { id: pagamentoExistente.id },
            data: { status: 'PAID', dataPagamento: dataPagamento }
         });
      } else {
         // Pagamento novo (ex: renovação automática)
         await prisma.pagamento.create({
            data: {
               empresaId: empresa.id,
               valor: valor,
               metodo: body.payment.billingType || 'UNDEFINED',
               status: 'PAID',
               asaasId: asaasPaymentId,
               dataPagamento: dataPagamento
            }
         });
      }

      // 3. Lógica de Renovação da Assinatura
      const diasAdicionais = valor > 1000 ? 365 : 30; // Ajuste conforme seu preço real
      
      let novaDataValidade = new Date();
      
      // Se a empresa ainda tem dias sobrando, soma a partir do vencimento atual
      if (empresa.pagoAte && empresa.pagoAte > new Date()) {
          novaDataValidade = new Date(empresa.pagoAte);
      }
      
      novaDataValidade.setDate(novaDataValidade.getDate() + diasAdicionais);

      await prisma.empresa.update({
          where: { id: empresa.id },
          data: { 
              ativo: true,
              pagoAte: novaDataValidade
          }
      });

      console.log(`🎉 Assinatura renovada até: ${novaDataValidade.toLocaleDateString()}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Erro no Webhook:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}