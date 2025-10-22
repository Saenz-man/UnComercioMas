// src/categories/categories.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity'; 
import { CategoriesController } from './controllers/categories.controller';
import { CategoriesService } from './service/categories.service';
import { AuthModule } from '../auth/auth.module'; // Importar AuthModule para usar Guards

@Module({
    imports: [
        TypeOrmModule.forFeature([Category]), 
        AuthModule // Módulo que exporta RolesGuard y JwtStrategy
    ],
    controllers: [CategoriesController],
    providers: [CategoriesService],
    exports: [CategoriesService], 
})
export class CategoriesModule {}