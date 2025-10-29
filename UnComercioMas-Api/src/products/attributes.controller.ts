import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete,
  HttpCode, // <-- Importa esto
  HttpStatus, // <-- Importa esto
} from '@nestjs/common';
import { AttributesService } from './attributes.service'; 
// Este import ya debería funcionar

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  async findAll() { // <-- AÑADIR ASYNC
    return await this.attributesService.findAll();
  }

  @Post()
  async createAttribute(@Body() createDto: { nombre: string }) { // <-- AÑADIR ASYNC
    return await this.attributesService.create(createDto.nombre);
  }

  @Post(':attributeId/values')
  async addValue( // <-- AÑADIR ASYNC
    @Param('attributeId') attributeId: string,
    @Body() createValueDto: { valor: string },
  ) {
    return await this.attributesService.addValue(attributeId, createValueDto.valor);
  }

  @Delete('values/:valueId')
  @HttpCode(HttpStatus.NO_CONTENT) // <-- Buen decorador para un DELETE exitoso
  async removeValue(@Param('valueId') valueId: string) { // <-- AÑADIR ASYNC
    return await this.attributesService.removeValue(valueId);
  }
}