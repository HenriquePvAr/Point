const empresaId = searchParams.get('empresaId');
const pagamentos = await prisma.pagamento.findMany({
  where: { empresaId: empresaId, status: 'PAID' },
  orderBy: { dataPagamento: 'desc' }
});