import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Get all products with pagination, search, and filters
  async findAll(filters: FilterProductDto) {
    const { page = 1, limit = 10, search, categoryId, isActive, isFeatured } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get product by ID
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  // Get product by slug
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }

    return product;
  }

  // Create a new product
  async create(createProductDto: CreateProductDto) {
    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createProductDto.categoryId} not found`,
      );
    }

    // Check if slug already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug: createProductDto.slug },
    });

    if (existingProduct) {
      throw new ConflictException(`Product with slug ${createProductDto.slug} already exists`);
    }

    // Create product
    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        slug: createProductDto.slug,
        description: createProductDto.description,
        price: createProductDto.price,
        discount: createProductDto.discount ?? 0,
        stock: createProductDto.stock,
        images: createProductDto.images,
        categoryId: createProductDto.categoryId,
        isActive: createProductDto.isActive ?? true,
        isFeatured: createProductDto.isFeatured ?? false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return product;
  }

  // Update a product
  async update(id: string, updateProductDto: UpdateProductDto) {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if category exists (if being updated)
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateProductDto.categoryId} not found`,
        );
      }
    }

    // Check if slug already exists (if being updated)
    if (updateProductDto.slug && updateProductDto.slug !== existingProduct.slug) {
      const slugExists = await this.prisma.product.findUnique({
        where: { slug: updateProductDto.slug },
      });

      if (slugExists) {
        throw new ConflictException(
          `Product with slug ${updateProductDto.slug} already exists`,
        );
      }
    }

    // Update product
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(updateProductDto.name && { name: updateProductDto.name }),
        ...(updateProductDto.slug && { slug: updateProductDto.slug }),
        ...(updateProductDto.description !== undefined && {
          description: updateProductDto.description,
        }),
        ...(updateProductDto.price && { price: updateProductDto.price }),
        ...(updateProductDto.discount !== undefined && {
          discount: updateProductDto.discount,
        }),
        ...(updateProductDto.stock !== undefined && { stock: updateProductDto.stock }),
        ...(updateProductDto.images && { images: updateProductDto.images }),
        ...(updateProductDto.categoryId && { categoryId: updateProductDto.categoryId }),
        ...(updateProductDto.isActive !== undefined && {
          isActive: updateProductDto.isActive,
        }),
        ...(updateProductDto.isFeatured !== undefined && {
          isFeatured: updateProductDto.isFeatured,
        }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return product;
  }

  // Delete a product
  async remove(id: string) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Delete product
    await this.prisma.product.delete({
      where: { id },
    });

    return {
      message: 'Product deleted successfully',
      id,
    };
  }
}

