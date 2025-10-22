// src/inventory/DTO/update-stock.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateStockDto {

  @ApiProperty({ 
    description: 'La nueva cantidad total de stock', 
    example: 150 
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  stock: number;
}