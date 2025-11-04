'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
// --- (CORRECCIÓN) Importar el tipo de Zod desde ProductForm ---
import { ProductFormData } from './ProductForm'; 
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useEffect } from 'react';

// --- INICIO: NUEVAS IMPORTACIONES ---
// Importamos el hook que tú proporcionaste
import { useCategories } from '@/hooks/useCategories'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// --- FIN: NUEVAS IMPORTACIONES ---


// --- Funciones de Formato de Moneda ---
const parseCurrency = (value: string): number => {
  if (!value) return 0;
  // Quita $ , y espacios
  const numString = value.replace(/[$,\s]/g, '');
  const parsed = parseFloat(numString);
  return isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (value: number | null | undefined): string => {
  const num = Number(value);
  if (isNaN(num) || num === 0) {
    return ''; // Devuelve vacío para mostrar el placeholder
  }
  // Formato simple con 2 decimales
  return `$ ${num.toFixed(2)}`;
};


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
  // 1. Conectarse al formulario padre (Usando el tipo de Zod)
  const { register, control, watch, setValue, formState: { errors } } = useFormContext<ProductFormData>();

  // --- INICIO: LLAMAR AL HOOK DE CATEGORÍAS ---
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  // --- FIN: LLAMAR AL HOOK DE CATEGORÍAS ---

  // 2. Hook para "preciosPorVolumen"
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'preciosPorVolumen',
  });

  // 3. Lógica SLUG
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
        {/* Nombre */}
        <div>
          <Label htmlFor="nombre">Nombre del Producto</Label>
          <Input id="nombre" {...register('nombre')} />
          {/* @ts-ignore */}
          {errors.nombre && <p className="text-red-500 text-sm">{errors.nombre.message}</p>}
        </div>

        {/* Modelo */}
        <div>
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" {...register('modelo')} />
        </div>
        
        {/* Slug */}
        <div>
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input id="slug" {...register('slug')} />
           {/* @ts-ignore */}
          {errors.slug && <p className="text-red-500 text-sm">{errors.slug.message}</p>}
        </div>

        {/* Descripción */}
        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" {...register('descripcion')} />
        </div>

        {/* Precio por Pieza */}
        <div>
          <Label htmlFor="precioPorPieza">Precio por Pieza</Label>
          <Controller
            name="precioPorPieza"
            control={control}
            render={({ field }) => (
              <Input
                id="precioPorPieza"
                type="text" 
                placeholder="$ 0.00"
                value={formatCurrency(field.value)} 
                onChange={(e) => {
                  const numValue = parseCurrency(e.target.value); 
                  field.onChange(numValue); 
                }}
                onBlur={field.onBlur} 
              />
            )}
          />
           {/* @ts-ignore */}
          {errors.precioPorPieza && <p className="text-red-500 text-sm">{errors.precioPorPieza.message}</p>}
        </div>
        
        {/* --- Categoría (ACTUALIZADO) --- */}
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
                  {/* Mapeamos sobre las categorías de tu hook */}
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

        {/* Precios por Volumen */}
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
                
                <Controller
                  name={`preciosPorVolumen.${index}.precio`}
                  control={control}
                  render={({ field: priceField }) => (
                    <Input
                      type="text"
                      placeholder="Precio"
                      value={formatCurrency(priceField.value)}
                      onChange={(e) => {
                        priceField.onChange(parseCurrency(e.target.value));
                      }}
                      onBlur={priceField.onBlur}
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
      </CardContent>
    </Card>
  );
}

