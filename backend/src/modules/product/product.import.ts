import XLSX from "xlsx";
import prisma from "../../core/prisma";

export async function importProductsFromExcel(filePath: string, tenantId: number) {

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json<any>(sheet);

  if (!rows.length) return { count: 0 };

  const categories = await prisma.category.findMany({
    where: { active: true, tenantId },
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

  for (const row of rows) {

    const categoryId = resolveCategoryId(row.Categorias);

    productData.push({
      sku: String(row.Codigo),
      name: row.Nombre,
      laboratory: row.Laboratorio ?? null,
      description: row.Descripcion ?? null,
      observations: row.Observaciones ?? null,
      price: Number(row.Precio),
      cost: Number(row.Costo),
      tax: Number(row.Impuesto) > 1 ? Number(row.Impuesto) / 100 : Number(row.Impuesto),
      categoryId,
      tenantId,
    });
  }

  const priceLists = await prisma.priceList.findMany({
    where: { active: true, tenantId },
    select: { id: true, name: true },
  });

  const priceListIndex = new Map(
    priceLists.map(pl => [`Lista_${pl.name}`, pl.id])
  );

  const createdProducts = await prisma.$transaction(async (tx) => {

    for (const product of productData) {
      await tx.product.upsert({
        where: { tenantId_sku: { tenantId: product.tenantId, sku: product.sku } },
        update: {
          name: product.name,
          description: product.description,
          price: product.price,
          cost: product.cost,
          laboratory: product.laboratory,       
          observations: product.observations, 
          tax: product.tax, 
          categoryId: product.categoryId,
        },
        create: product,
      });
    }

    const products = await tx.product.findMany({
      where: {
        sku: { in: productData.map(p => p.sku) },
        tenantId,
      },
      select: { id: true, sku: true }
    });

    const productMap = new Map(products.map(p => [p.sku, p.id]));

    const barcodeData: any[] = [];

    rows.forEach(row => {

      if (!row.Codigos) return;

      const productId = productMap.get(String(row.Codigo));

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

    const priceData: { productId: number; priceListId: number; price: number }[] = [];

    for (const row of rows) {
      const productId = productMap.get(String(row.Codigo));
      if (!productId) continue;

      for (const [colName, priceListId] of priceListIndex.entries()) {
        if (row[colName] !== undefined && row[colName] !== "") {
          priceData.push({
            productId,
            priceListId,
            price: Number(row[colName]),
          });
        }
      }
    }

    if (priceData.length) {
      await Promise.all(
        priceData.map(({ productId, priceListId, price }) =>
          tx.productPrice.upsert({
            where: {
              tenantId_productId_priceListId: { tenantId, productId, priceListId },
            },
            update: { price },
            create: { tenantId, productId, priceListId, price },
          })
        )
      );
    }

    return { count: products.length, prices: priceData.length };
  });

  return createdProducts;
}