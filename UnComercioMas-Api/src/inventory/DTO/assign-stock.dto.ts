// src/inventory/DTO/assign-stock.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class AssignStockDto {

  @ApiProperty({ description: 'ID (UUID) de la Sucursal' })
  @IsUUID()
  @IsNotEmpty()
  sucursal_id: string;

  @ApiProperty({ description: 'ID (UUID) de la Variante (SKU)' })
  @IsUUID()
  @IsNotEmpty()
  variante_id: string;

  @ApiProperty({ description: 'Cantidad de stock a asignar', example: 100 })
  @IsInt()
  @Min(0)
  stock: number;
}