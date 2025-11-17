import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignBranchDto {
    @ApiProperty({
        description: 'ID del usuario (vendedor) al que se le asignará la sucursal',
        example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    })
    @IsUUID()
    @IsNotEmpty()
    vendedorId: string;

    @ApiProperty({
        description: 'ID de la sucursal existente donde trabajará el vendedor',
        example: 'b2f23312-55a1-4d21-9f3a-123456789abc'
    })
    @IsUUID() // Asumiendo que las sucursales también usan UUID
    @IsNotEmpty()
    sucursalId: string;
}