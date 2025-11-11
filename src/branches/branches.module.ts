import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- 1. IMPORTA ESTO
import { Branch } from './entities/branch.entity'; // <-- 2. IMPORTA TU ENTIDAD (asegúrate que la ruta sea correcta)

import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Branch]), // <-- 3. AÑADE ESTA LÍNEA
    ],
    controllers: [BranchesController],
    providers: [BranchesService],
    exports: [BranchesService], // <-- Deja esto, lo necesitará el InventoryModule
})
export class BranchesModule {}