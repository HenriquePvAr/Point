const ASAAS_API_URL = process.env.ASAAS_ENV === 'production' 
  ? 'https://api.asaas.com/v3' 
  : 'https://sandbox.asaas.com/api/v3';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

// 1. Cria o Cliente no Asaas (Se ainda não existir)
export async function criarClienteAsaas(empresa) {
  try {
    const res = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        name: empresa.nome,
        cpfCnpj: empresa.cnpj || undefined, // Se tiver CNPJ
        externalReference: empresa.id,
        notificationDisabled: true, // Para o Asaas não mandar email pro cliente (opcional)
      })
    });
    
    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0].description);
    return data.id; // Retorna o ID do cliente (cus_xxxx)
  } catch (error) {
    console.error("Erro criarClienteAsaas:", error);
    throw error;
  }
}

// 2. Cria a Cobrança PIX
export async function criarCobrancaPix(customerId, valor) {
  try {
    const res = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX",
        value: valor,
        dueDate: new Date().toISOString().split('T')[0], // Vence hoje
        description: "Assinatura Sistema de Ponto"
      })
    });

    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0].description);

    // Precisamos pegar o QR Code e o Copia e Cola
    const resQr = await fetch(`${ASAAS_API_URL}/payments/${data.id}/pixQrCode`, {
        headers: { 'access_token': ASAAS_API_KEY }
    });
    const dataQr = await resQr.json();

    return {
        id: data.id,
        invoiceUrl: data.invoiceUrl, // Link da fatura bonitinha do Asaas
        qrCodeImage: dataQr.encodedImage, // Imagem base64 do QR
        pixCopiaCola: dataQr.payload // O código texto
    };

  } catch (error) {
    console.error("Erro criarCobrancaPix:", error);
    throw error;
  }
}