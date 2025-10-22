import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../DTO/create-category';
import { UpdateCategoryDto } from '../DTO/update-category';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // Crear categoría
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  // Leer todas las categorías
  async findAll(): Promise<Category[]> {
    const categories = await this.categoryRepository.find({
      relations: ['parent', 'children'],
    });

    return categories.map(cat => ({
      ...cat,
      children: cat.children || [], // aseguramos que children nunca sea undefined
    }));
  }

  // Leer una categoría por ID
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!category) {
      throw new NotFoundException(`Categoría con ID "${id}" no encontrada.`);
    }
    return { ...category, children: category.children || [] };
  }

  // Actualizar categoría
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  // Eliminar categoría
  async remove(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Categoría con ID "${id}" no encontrada.`);
    }
  }
}
