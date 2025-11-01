import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // Get all categories
  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return categories;
  }

  // Get category by slug with products
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            discount: true,
            stock: true,
            images: true,
            isActive: true,
            isFeatured: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return category;
  }

  // Get category by ID
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            discount: true,
            stock: true,
            images: true,
            isActive: true,
            isFeatured: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  // Create a new category
  async create(createCategoryDto: CreateCategoryDto) {
    // Check if slug already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug: createCategoryDto.slug },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with slug ${createCategoryDto.slug} already exists`,
      );
    }

    // Create category
    const category = await this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        slug: createCategoryDto.slug,
        description: createCategoryDto.description,
        image: createCategoryDto.image,
      },
    });

    return category;
  }

  // Update a category
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Check if category exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if slug already exists (if being updated)
    if (updateCategoryDto.slug && updateCategoryDto.slug !== existingCategory.slug) {
      const slugExists = await this.prisma.category.findUnique({
        where: { slug: updateCategoryDto.slug },
      });

      if (slugExists) {
        throw new ConflictException(
          `Category with slug ${updateCategoryDto.slug} already exists`,
        );
      }
    }

    // Update category
    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...(updateCategoryDto.name && { name: updateCategoryDto.name }),
        ...(updateCategoryDto.slug && { slug: updateCategoryDto.slug }),
        ...(updateCategoryDto.description !== undefined && {
          description: updateCategoryDto.description,
        }),
        ...(updateCategoryDto.image !== undefined && {
          image: updateCategoryDto.image,
        }),
      },
    });

    return category;
  }

  // Delete a category
  async remove(id: string) {
    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if category has products (Prisma will restrict deletion due to onDelete: Restrict)
    if (category.products.length > 0) {
      throw new ConflictException(
        `Cannot delete category with ID ${id} because it has ${category.products.length} associated products`,
      );
    }

    // Delete category
    await this.prisma.category.delete({
      where: { id },
    });

    return {
      message: 'Category deleted successfully',
      id,
    };
  }
}

