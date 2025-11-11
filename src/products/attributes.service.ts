import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from './entities/attribute.entity';
import { AttributeValue } from './entities/attribute-value.entity';

@Injectable()
export class AttributesService {
  
  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    
    @InjectRepository(AttributeValue)
    private readonly attributeValueRepository: Repository<AttributeValue>,
  ) {}

  /**
   * Obtiene todos los atributos (ej: Talla, Color) con sus valores.
   */
  findAll() {
    return this.attributeRepository.find({
      relations: ['valores'], // Carga la relación 'valores' de cada atributo
    });
  }

  /**
   * Crea un nuevo atributo (ej: "Material")
   */
  async create(nombre: string) {
    try {
      const newAttribute = this.attributeRepository.create({ nombre });
      return await this.attributeRepository.save(newAttribute);
    } catch (error) {
      if (error.code === '23505') { // Error de 'unique constraint'
        throw new BadRequestException(`El atributo '${nombre}' ya existe.`);
      }
      throw error;
    }
  }

  /**
   * Añade un nuevo valor (ej: "Rojo") a un atributo existente (ej: "Color")
   */
  async addValue(attributeId: string, valor: string) {
    const attribute = await this.attributeRepository.findOneBy({ id: attributeId });
    if (!attribute) {
      throw new NotFoundException(`Atributo con ID '${attributeId}' no encontrado.`);
    }

    // Opcional: verificar si el valor ya existe para este atributo
    const valorExistente = await this.attributeValueRepository.findOneBy({
      valor: valor,
      attribute: { id: attributeId }
    });

    if (valorExistente) {
      throw new BadRequestException(`El valor '${valor}' ya existe para este atributo.`);
    }

    const newValue = this.attributeValueRepository.create({ 
      valor,
      attribute: attribute, // Asocia con el padre
    });
    
    return await this.attributeValueRepository.save(newValue);
  }

  /**
   * Elimina un valor específico (ej: "Azul Rey") por su ID
   */
  async removeValue(valueId: string) {
    const result = await this.attributeValueRepository.delete(valueId);
    if (result.affected === 0) {
      throw new NotFoundException(`Valor con ID '${valueId}' no encontrado.`);
    }
    // No es necesario devolver nada, un status 200 (o 204) es suficiente
    return; 
  }
}