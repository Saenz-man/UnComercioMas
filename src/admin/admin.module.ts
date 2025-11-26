// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <--- 1. IMPORTAR
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
// Importamos UsersModule para poder usar el UsersCoreService
import { UsersModule } from '../users/users.module';
import { BranchesModule } from '../branches/branches.module'; // <--- 1. IMPORTAR
// Importamos la Entidad Branch (para decirle a TypeORM qué repositorio queremos)
import { Branch } from '../branches/entities/branch.entity'; // <--- 2. IMPORTAR

@Module({
    imports: [
        UsersModule, // <--- IMPORTANTE: Esto nos da acceso a los exports de UsersModule
        BranchesModule,
        TypeOrmModule.forFeature([Branch]), // <--- 3. REGISTRAR EL REPOSITORIO DE BRANCH
    ],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }