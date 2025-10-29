import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AttributeValue } from './attribute-value.entity';

@Entity({ name: 'attributes' })
export class Attribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true }) // Ej: "Talla", "Color"
  nombre: string;

  @OneToMany(() => AttributeValue, (value) => value.attribute, {
    cascade: true, 
  })
  valores: AttributeValue[];
}