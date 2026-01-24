import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { criarClienteAsaas, criarCobrancaPix } from "@/lib/asaas";

export async function POST(req) {
  try {
    const { empresaId, plano } = await req.json();

    // 1. Busca a empresa
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    // 2. Verifica/Cria cliente no Asaas
    let asaasId = empresa.asaasCustomerId;

    if (!asaasId) {
        console.log("Criando cliente no Asaas...");
        asaasId = await criarClienteAsaas(empresa);
        
        // Salva o ID na empresa para não criar de novo depois
        await prisma.empresa.update({
            where: { id: empresa.id },
            data: { asaasCustomerId: asaasId }
        });
    }

    // 3. Define valor (R$ 160,00 ou R$ 1600,00)
    const valor = plano === 'ANUAL' ? 1600 : 160;

    // 4. Gera o Pix no Asaas
    console.log("Gerando Pix no Asaas...");
    const dadosPix = await criarCobrancaPix(asaasId, valor);

    // ==========================================================
    // ✅ PASSO ESSENCIAL QUE FALTA: SALVAR NO SEU BANCO DE DADOS
    // ==========================================================
    // Sem isso, o Webhook não consegue liberar o acesso depois!
    await prisma.pagamento.create({
      data: {
        empresaId: empresa.id,
        valor: valor,
        metodo: "PIX",
        status: "PENDING",
        asaasId: dadosPix.id, // ID da cobrança que vem do Asaas
      }
    });

    return NextResponse.json({ 
      success: true, 
      id: dadosPix.id,
      invoiceUrl: dadosPix.invoiceUrl, // Link da fatura
      pixCopiaCola: dadosPix.pixCopiaCola, // Código copia e cola
      pixQrCode: dadosPix.pixQrCode // Base64 do QR Code
    });

  } catch (error) {
    console.error("Erro ao gerar pagamento:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}