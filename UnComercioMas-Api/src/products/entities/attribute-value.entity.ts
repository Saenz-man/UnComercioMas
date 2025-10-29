import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Attribute } from '../entities/attribute.entity'; // <-- Este import ya funcionará

@Entity({ name: 'attribute_values' })
export class AttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text') // Ej: "S", "Rojo", "Algodón"
  valor: string;

  @ManyToOne(() => Attribute, (attr: Attribute) => attr.valores) // <-- 'attr: Attribute'
  attribute: Attribute;
}