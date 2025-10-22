// src/branches/DTO/update-branch.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateBranchDto } from './create-branch.dto';

// PartialType hace que todos los campos de CreateBranchDto sean opcionales
export class UpdateBranchDto extends PartialType(CreateBranchDto) {}