import {
    IsArray, IsEnum, IsNotEmpty, IsOptional,
    IsUUID, ValidateNested, Min
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/pedido.entity';

class OrderItemDto {
    @ApiProperty({ description: 'ID de la variante (SKU) a vender' })
    @IsUUID()
    @IsNotEmpty()
    variante_id: string;

    @ApiProperty({ description: 'Cantidad a vender', example: 1 })
    @Min(1)
    @IsNotEmpty()
    cantidad: number;
}

export class CreatePosOrderDto {
    @ApiProperty({ description: 'Lista de productos en el carrito', type: [OrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.EFECTIVO })
    @IsEnum(PaymentMethod)
    @IsOptional()
    metodo_pago?: PaymentMethod;

    @ApiProperty({ description: 'ID del cliente (Opcional)', required: false })
    @IsUUID()
    @IsOptional()
    cliente_id?: string;
}