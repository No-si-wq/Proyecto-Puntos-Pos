import XLSX from "xlsx";
import prisma from "../../core/prisma";

export async function importProductsFromExcel(filePath: string) {

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json<any>(sheet);

  if (!rows.length) return { count: 0 };

  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { id: true, name: true, parentId: true }
  });

  const categoryIndex = new Map<string, number>();

  for (const cat of categories) {
    const key = `${cat.parentId ?? "root"}:${cat.name}`;
    categoryIndex.set(key, cat.id);
  }

  function resolveCategoryId(path: string) {

    const levels = path.split(">").map((s: string) => s.trim());

    let parentId: number | null = null;
    let currentId: number | undefined;

    for (const level of levels) {
      const key = `${parentId ?? "root"}:${level}`;
      currentId = categoryIndex.get(key);

      if (!currentId) {
        throw new Error(`Categoría no encontrada: ${path}`);
      }

      parentId = currentId;
    }

    return currentId!;
  }

  const productData: any[] = [];
  const barcodeData: any[] = [];

  for (const row of rows) {

    const categoryId = resolveCategoryId(row.Categorias);

    productData.push({
      sku: row.Codigo,
      name: row.Nombre,
      description: row.Descripcion ?? null,
      price: Number(row.Precio),
      cost: Number(row.Costo),
      categoryId,
    });
  }

  const createdProducts = await prisma.$transaction(async (tx) => {

    const inserted = await tx.product.createMany({
      data: productData,
      skipDuplicates: true
    });

    const products = await tx.product.findMany({
      where: {
        sku: { in: productData.map(p => p.sku) }
      },
      select: { id: true, sku: true }
    });

    const productMap = new Map(products.map(p => [p.sku, p.id]));

    rows.forEach(row => {

      if (!row.Codigos) return;

      const productId = productMap.get(row.Codigo);

      if (!productId) return;

      const codes = String(row.Codigos)
        .split(",")
        .map((b: string) => b.trim());

      codes.forEach(code => {
        barcodeData.push({
          code,
          productId
        });
      });

    });

    if (barcodeData.length) {
      await tx.barcode.createMany({
        data: barcodeData,
        skipDuplicates: true
      });
    }

    return inserted;
  });

  return createdProducts;
}