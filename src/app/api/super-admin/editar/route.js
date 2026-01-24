await prisma.empresa.update({
  where: { id: body.id },
  data: { nome: body.nome, cnpj: body.cnpj }
});