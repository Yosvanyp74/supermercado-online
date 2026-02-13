import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
            _count: { select: { products: true } },
          },
          orderBy: { position: 'asc' },
        },
        _count: { select: { products: true } },
      },
      orderBy: { position: 'asc' },
    });

    return categories;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          include: { _count: { select: { products: true } } },
          orderBy: { position: 'asc' },
        },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name);

    const existing = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Já existe uma categoria com este nome');
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Categoria pai não encontrada');
      }
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId,
        position: dto.position ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: true,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const data: Prisma.CategoryUpdateInput = { ...dto };

    if (dto.name && dto.name !== category.name) {
      const slug = slugify(dto.name);

      const existing = await this.prisma.category.findFirst({
        where: { slug, id: { not: id } },
      });

      if (existing) {
        throw new ConflictException('Já existe uma categoria com este nome');
      }

      data.slug = slug;
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException(
          'Uma categoria não pode ser pai de si mesma',
        );
      }

      if (dto.parentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: dto.parentId },
        });

        if (!parent) {
          throw new NotFoundException('Categoria pai não encontrada');
        }
      }

      data.parent = dto.parentId
        ? { connect: { id: dto.parentId } }
        : { disconnect: true };
      delete (data as any).parentId;
    }

    return this.prisma.category.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: true,
        _count: { select: { products: true } },
      },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category._count.products > 0) {
      throw new ConflictException(
        'Não é possível remover uma categoria que possui produtos associados',
      );
    }

    if (category._count.children > 0) {
      throw new ConflictException(
        'Não é possível remover uma categoria que possui subcategorias',
      );
    }

    await this.prisma.category.delete({ where: { id } });

    return { message: 'Categoria removida com sucesso' };
  }

  async getProductsByCategory(
    id: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      categoryId: id,
      status: 'ACTIVE',
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { position: Prisma.SortOrder.asc } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
