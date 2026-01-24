export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  // Use deleteMany ou exclusão em cascata no Prisma
  await prisma.empresa.delete({ where: { id: id } });
  return NextResponse.json({ success: true });
}