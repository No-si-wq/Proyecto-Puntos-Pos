import prisma from "../config/prisma";

export class CategoryRepository {
  static create(data: {
    name: string;
    parentId?: number | null;
    active?: boolean;
  }) {
    return prisma.category.create({ data });
  }

  static findById(id: number) {
    return prisma.category.findUnique({
      where: { id },
    });
  }

  static findActiveById(id: number) {
    return prisma.category.findFirst({
      where: { id, active: true },
    });
  }

  static findChildren(parentId: number | null) {
    return prisma.category.findMany({
      where: { parentId, active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        parentId: true,
        _count: { select: { children: true } },
      },
    });
  }

  static findAllActive() {
    return prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }

  static update(id: number, data: any) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  static async importFromPaths(paths: string[][]) {
    return prisma.$transaction(async (tx) => {
      for (const row of paths) {
        if (!row.length) continue;

        const [rootName, ...levels] = row;

        let root = await tx.category.findFirst({
          where: { name: rootName, parentId: null, active: true },
        });

        if (!root) {
          root = await tx.category.create({
            data: {
              name: rootName,
              parentId: null,
              active: true,
            },
          });
        }

        let parentId = root.id;

        for (const name of levels) {
          const existing = await tx.category.findFirst({
            where: { name, parentId, active: true },
          });

          if (existing) {
            parentId = existing.id;
          } else {
            const created = await tx.category.create({
              data: { name, parentId, active: true },
            });
            parentId = created.id;
          }
        }
      }
    });
  }

  static countActiveChildren(parentId: number) {
    return prisma.category.count({
      where: { parentId, active: true },
    });
  }
}