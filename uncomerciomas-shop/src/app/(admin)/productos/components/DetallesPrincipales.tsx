'use client';

// --- INICIO: NUEVAS IMPORTACIONES ---
import { useFormContext, useFieldArray, Controller, ControllerRenderProps } from 'react-hook-form';
// --- CORRECCIÓN 1: Importar 'React' ---
import React, { useState, useEffect, useRef } from 'react';
// --- FIN: NUEVAS IMPORTACIONES ---

import { ProductFormData } from './ProductForm'; 
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// --- CORRECCIÓN 2: Quitar 'InputProps' ---
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Funciones de Formato de Moneda (Ligeramente modificadas) ---
/**
 * Parsea un string (formateado o no) a un número.
 * "100.43" -> 100.43
 * "$ 100.43" -> 100.43
 * "100." -> 100
 */
const parseCurrency = (value: string): number => {
  if (typeof value !== 'string') return 0;
  // Permite al usuario escribir "100." o ".43"
  if (value === '.') return 0;
  
  const numString = value.replace(/[$,\s]/g, '');
  if (numString === '') return 0;
  
  const parsed = parseFloat(numString);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formatea un número a un string de moneda.
 * 100.43 -> "$ 100.43"
 * 100 -> "$ 100.00"
 */
const formatCurrency = (value: number | null | undefined): string => {
  const num = Number(value);
  if (isNaN(num) || num === 0) {
    return ''; // Devuelve vacío para mostrar el placeholder
  }
  return `$ ${num.toFixed(2)}`;
};

// --- INICIO: NUEVO COMPONENTE REUTILIZABLE ---

// --- CORRECCIÓN 3: Extender 'React.InputHTMLAttributes' ---
interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Pasamos el objeto 'field' del Controller de RHF
  field: ControllerRenderProps<any, any>; 
}

/**
 * Componente Input que maneja el formato de moneda
 * onFocus (muestra el número) y onBlur (muestra el formato $).
 */
const CurrencyInput = ({ field, ...props }: CurrencyInputProps) => {
  // Estado local para el valor que se muestra en el input
  const [displayValue, setDisplayValue] = useState(
    field.value ? formatCurrency(field.value) : ''
  );

  // Ref para saber si el campo está enfocado
  const isFocusedRef = useRef(false);

  // Sincroniza el valor del formulario (RHF) con el display local
  // si el valor de RHF cambia *externamente* (ej. reset, carga inicial)
  useEffect(() => {
    if (!isFocusedRef.current) {
      setDisplayValue(field.value ? formatCurrency(field.value) : '');
    }
  }, [field.value]); // Solo se ejecuta si el valor de RHF cambia

  return (
    <Input
      {...props} // Pasa props (ej. placeholder, id)
      type="text" // Debe ser "text" para mostrar "$"
      value={displayValue}
      onFocus={() => {
        isFocusedRef.current = true;
        // Al enfocar: mostrar el número crudo (o vacío)
        setDisplayValue(field.value ? String(field.value) : '');
      }}
      onChange={(e) => {
        // Mientras escribe: solo permitir números y un punto
        let value = e.target.value;
        value = value.replace(/[^0-9.]/g, ''); // Solo números y puntos
        
        // Asegurar un solo punto decimal
        const parts = value.split('.');
        if (parts.length > 2) {
          value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        setDisplayValue(value); // Actualizar el input local
        field.onChange(parseCurrency(value)); // Actualizar RHF con el número
      }}
      onBlur={() => {
        isFocusedRef.current = false;
        // Al desenfocar: formatear el valor
        // Usamos field.value (el número) que ya fue actualizado en onChange
        setDisplayValue(field.value ? formatCurrency(field.value) : '');
        field.onBlur(); // Notificar a RHF que el campo fue "tocado"
      }}
    />
  );
};
// --- FIN: NUEVO COMPONENTE REUTILIZABLE ---


// Función simple para generar slugs
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');


export function DetallesPrincipales() {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext<ProductFormData>();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'preciosPorVolumen',
  });

  // Lógica SLUG (sin cambios)
  const nombre = watch('nombre');
  const modelo = watch('modelo');
  useEffect(() => {
    const slug = slugify(`${nombre || ''} ${modelo || ''}`);
    if (slug) {
      setValue('slug', slug, { shouldValidate: true });
    }
  }, [nombre, modelo, setValue]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles Principales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nombre, Modelo, Slug, Descripción (sin cambios) */}
        <div>
          <Label htmlFor="nombre">Nombre del Producto</Label>
          <Input id="nombre" {...register('nombre')} />
          {/* @ts-ignore */}
          {errors.nombre && <p className="text-red-500 text-sm">{errors.nombre.message}</p>}
        </div>
        <div>
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" {...register('modelo')} />
        </div>
        <div>
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input id="slug" {...register('slug')} />
           {/* @ts-ignore */}
          {errors.slug && <p className="text-red-500 text-sm">{errors.slug.message}</p>}
        </div>
        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" {...register('descripcion')} />
        </div>

        {/* --- INICIO: ACTUALIZACIÓN Precio por Pieza --- */}
        <div>
          <Label htmlFor="precioPorPieza">Precio por Pieza</Label>
          <Controller
            name="precioPorPieza"
            control={control}
            render={({ field }) => (
              // Usamos el nuevo componente
              <CurrencyInput
                field={field}
                id="precioPorPieza"
                placeholder="$ 0.00"
              />
            )}
          />
           {/* @ts-ignore */}
          {errors.precioPorPieza && <p className="text-red-500 text-sm">{errors.precioPorPieza.message}</p>}
        </div>
        {/* --- FIN: ACTUALIZACIÓN Precio por Pieza --- */}
        
        {/* Categoría (sin cambios) */}
        <div>
          <Label>Categoría</Label>
          <Controller
            name="categoria_id"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoadingCategories}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoadingCategories 
                      ? "Cargando categorías..." 
                      : "Selecciona una categoría"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {/* @ts-ignore */}
          {errors.categoria_id && <p className="text-red-500 text-sm">{errors.categoria_id.message}</p>}
        </div>

        {/* --- INICIO: ACTUALIZACIÓN Precios por Volumen --- */}
        <div>
          <h4 className="font-medium mb-2">Precios por Volumen</h4>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-center">
                <Input
                  type="number"
                  placeholder="Cantidad Mínima"
                  {...register(`preciosPorVolumen.${index}.cantidad_minima`, { valueAsNumber: true })}
                />
                
                {/* Usamos el nuevo componente aquí también */}
                <Controller
                  name={`preciosPorVolumen.${index}.precio`}
                  control={control}
                  render={({ field: priceField }) => (
                    <CurrencyInput
                      field={priceField}
                      placeholder="Precio"
                    />
                  )}
                />

                <Button variant="outline" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => append({ cantidad_minima: 10, precio: 0 })}
          >
            Añadir Nivel de Precio
          </Button>
        </div>
        {/* --- FIN: ACTUALIZACIÓN Precios por Volumen --- */}
      </CardContent>
    </Card>
  );
}

