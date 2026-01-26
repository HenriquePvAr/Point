import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { criarClienteAsaas, criarCobrancaPix } from "@/lib/asaas";

export async function POST(req) {
  try {
    const { empresaId, plano } = await req.json();

    // 1. Busca a empresa no banco de dados
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // 2. Verifica se a empresa já tem um ID de cliente no Asaas
    let asaasId = empresa.asaasCustomerId;

    if (!asaasId) {
      console.log("Criando cliente no Asaas...");
      asaasId = await criarClienteAsaas(empresa);
      
      // Salva o ID do Asaas na empresa para evitar duplicatas futuras
      await prisma.empresa.update({
        where: { id: empresa.id },
        data: { asaasCustomerId: asaasId }
      });
    }

    // 3. Define o valor baseado no plano (R$ 160,00 ou R$ 1600,00)
    const valor = plano === 'ANUAL' ? 1600 : 160;

    // 4. Gera a cobrança Pix no Asaas
    // O retorno de criarCobrancaPix contém { id, invoiceUrl, qrCodeImage, pixCopiaCola }
    console.log("Gerando Pix no Asaas...");
    const dadosPix = await criarCobrancaPix(asaasId, valor);

    // 5. Salva o registro do pagamento como PENDENTE no banco de dados
    // Essencial para o Webhook validar a liberação de acesso depois
    await prisma.pagamento.create({
      data: {
        empresaId: empresa.id,
        valor: valor,
        metodo: "PIX",
        status: "PENDING",
        asaasId: dadosPix.id, // ID da cobrança (pay_xxx)
      }
    });

    // 6. Retorna os dados para o front-end
    // CORREÇÃO: A chave foi alterada para 'qrCodeImage' para bater com o seu componente Front-end
    return NextResponse.json({ 
      success: true, 
      id: dadosPix.id,
      invoiceUrl: dadosPix.invoiceUrl,
      pixCopiaCola: dadosPix.pixCopiaCola,
      qrCodeImage: dadosPix.qrCodeImage // Nome exato que o seu front-end espera
    });

  } catch (error) {
    console.error("Erro ao gerar pagamento:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}