// src/inventory/DTO/transfer-stock.dto.ts
import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class TransferStockDto {
  @IsUUID()
  source_branch_id: string;

  @IsUUID()
  destination_branch_id: string;

  @IsUUID()
  variante_id: string;

  @IsInt()
  @IsPositive()
  quantity: number;
}