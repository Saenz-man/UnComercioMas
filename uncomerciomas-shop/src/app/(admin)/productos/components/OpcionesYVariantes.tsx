'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { ProductFormData } from './ProductForm'; 
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUpload } from '@/hooks/useUpload';
// import { useAttributes } from '@/hooks/useAttributes'; // <-- Eliminado
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, UploadCloud, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
// import { Select... } from "@/components/ui/select"; // <-- Eliminado
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// Interfaz de estado local
interface OptionDefinition {
  name: string;
  values: string[]; 
}

// Función 'cartesian' (sin cambios)
function cartesian<T>(...arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  const [head, ...tail] = arrays;
  const tailCartesian = cartesian(...tail);
  const result: T[][] = [];
  for (const h of head) {
    for (const t of tailCartesian) {
      result.push([h, ...t]);
    }
  }
  return result;
}

// Función para formatear precio (ya no se usa aquí, pero se puede quedar)
const formatCurrency = (value: number | null | undefined): string => {
  const num = Number(value);
  if (isNaN(num)) return '$ 0.00';
  return `$ ${num.toFixed(2)}`;
};

// --- VALORES POR DEFECTO PARA LAS OPCIONES ---
const defaultOptionDefs: OptionDefinition[] = [
  { name: 'Talla', values: ['Ch', 'M', 'G'] },
  { name: 'Color', values: ['Blanco', 'Negro'] }
];

export function OpcionesYVariantes() {
  const { control, watch, setValue, getValues, register, formState: { errors } } = useFormContext<ProductFormData>();
  
  // --- ESTADOS LOCALES (MODIFICADOS) ---
  const [hasOptions, setHasOptions] = useState(true);
  const [optionDefs, setOptionDefs] = useState<OptionDefinition[]>(defaultOptionDefs);
  const [currentTagValues, setCurrentTagValues] = useState<Record<number, string>>({});

  const { fields, replace, remove } = useFieldArray({
    control,
    name: 'variantes',
  });
  
  const uploadMutation = useUpload();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // --- LÓGICA PARA AÑADIR/QUITAR TAGS ---
  const handleAddTag = (optionIndex: number) => {
    // ... (sin cambios)
    const valueToAdd = currentTagValues[optionIndex]?.trim();
    if (!valueToAdd) return; 

    const newDefs = [...optionDefs];
    const currentValues = newDefs[optionIndex].values;

    if (!currentValues.includes(valueToAdd)) {
      newDefs[optionIndex].values.push(valueToAdd);
      setOptionDefs(newDefs);
    }
    
    setCurrentTagValues(prev => ({ ...prev, [optionIndex]: '' }));
  };

  const handleRemoveTag = (optionIndex: number, valueIndex: number) => {
    // ... (sin cambios)
    const newDefs = [...optionDefs];
    newDefs[optionIndex].values.splice(valueIndex, 1);
    setOptionDefs(newDefs);
  };
  
  // --- LÓGICA DE GENERACIÓN (MODIFICADA) ---
  const handleGenerateVariants = () => {
    // 1. Si NO tiene opciones, generar 1 variante
    if (!hasOptions) {
      replace([{
        sku: '',
        stock: 0,
        foto: null,
        opciones: {}, 
        precio: getValues('precioPorPieza') || 0,
      }]);
      setValue('opciones', {});
      return;
    }

    // 2. Si SÍ tiene opciones, filtrar las válidas
    const validOptions = optionDefs.filter(
      (opt) => opt.name.trim() && opt.values.length > 0
    );

    if (validOptions.length === 0) {
      // Si no hay opciones válidas, generar la variante simple
      replace([{
        sku: '',
        stock: 0,
        foto: null,
        opciones: {}, 
        precio: getValues('precioPorPieza') || 0,
      }]);
      setValue('opciones', {});
      return; 
    }

    // --- (Lógica de generación normal sin cambios) ---
    const rhfOptions: Record<string, string[]> = {};
    const valueArrays: string[][] = [];

    validOptions.forEach((opt) => {
      rhfOptions[opt.name] = opt.values; 
      valueArrays.push(opt.values);
    });

    setValue('opciones', rhfOptions, { shouldValidate: true });

    const combinations = cartesian(...valueArrays);
    
    const newVariants = combinations.map((combo) => {
      const variantOptions: Record<string, string> = {};
      const skuParts: string[] = [];
      
      combo.forEach((value, index) => {
        const optionName = validOptions[index].name;
        variantOptions[optionName] = value;
        skuParts.push(value);
      });
      
      const baseSku = (getValues('nombre') || 'PRODUCTO').substring(0, 5).toUpperCase().replace(/\s+/g, '-');
      const variantSku = skuParts.join('-').toUpperCase().replace(/\s+/g, '-');

      return {
        sku: `${baseSku}-${variantSku}`,
        stock: 0,
        foto: null,
        opciones: variantOptions,
        precio: getValues('precioPorPieza') || 0, // <-- El precio se asigna aquí
      };
    });
    
    replace(newVariants);
  };

  // --- NUEVA LÓGICA PARA EL CHECKBOX ---
  const handleOptionsToggle = (checked: boolean) => {
    setHasOptions(checked);
    if (checked) {
      if(optionDefs.length === 0) {
        setOptionDefs(defaultOptionDefs);
      }
    } else {
      setOptionDefs([]);
      handleGenerateVariants(); 
    }
  };
  
  // --- (Resto de handlers sin cambios) ---
  const handleVariantImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    uploadMutation.mutate(file, {
      onSuccess: (url) => {
        setValue(`variantes.${index}.foto`, url, { shouldValidate: true });
        setUploadingIndex(null);
      },
      onError: () => setUploadingIndex(null),
    });
  };

  const updateOptionName = (index: number, name: string) => {
    const newDefs = [...optionDefs];
    newDefs[index].name = name;
    setOptionDefs(newDefs);
  };
  
  const updateTagInputValue = (index: number, value: string) => {
    setCurrentTagValues(prev => ({ ...prev, [index]: value }));
  };

  const addOptionDef = () => setOptionDefs([...optionDefs, { name: '', values: [] }]);
  const removeOptionDef = (index: number) => setOptionDefs(optionDefs.filter((_, i) => i !== index));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opciones y Variantes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* --- Columna 1: Formulario de Opciones --- */}
          <div className="space-y-6">
            {/* --- 1. CHECKBOX --- */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="hasOptions"
                checked={hasOptions}
                onCheckedChange={handleOptionsToggle}
              />
              <Label htmlFor="hasOptions">
                Este producto tiene múltiples opciones (ej. Talla, Color).
              </Label>
            </div>

            {/* --- 2. DEFINICIÓN DE OPCIONES (Condicional) --- */}
            {hasOptions && (
              <div className="space-y-4 p-4 border rounded-md">
                <Label>Opciones</Label>
                {optionDefs.map((opt, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex gap-3 items-center">
                      <Input
                        placeholder="Opción (ej. Talla)"
                        value={opt.name}
                        onChange={(e) => updateOptionName(index, e.target.value)}
                        className="w-1/3"
                      />
                      <Input
                        placeholder="Escribe un valor (ej. 'M') y presiona Enter"
                        value={currentTagValues[index] || ''}
                        onChange={(e) => updateTagInputValue(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault(); 
                            handleAddTag(index);
                          }
                        }}
                        className="flex-1"
                      />
                      <Button variant="outline" size="icon" onClick={() => removeOptionDef(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
                      {opt.values.map((value, valueIndex) => (
                        <Badge key={valueIndex} variant="secondary">
                          {value}
                          <button 
                            type="button" 
                            className="ml-1 rounded-full outline-none"
                            onClick={() => handleRemoveTag(index, valueIndex)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {opt.values.length === 0 && (
                        <span className="text-sm text-muted-foreground ml-1">Añade valores para esta opción...</span>
                      )}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addOptionDef}>
                  Añadir otra opción
                </Button>
              </div>
            )}

            {/* --- 3. BOTÓN DE GENERAR --- */}
            <Button type="button" onClick={handleGenerateVariants}>
              Generar Variantes
            </Button>
          </div>
          {/* --- Fin Columna 1 --- */}

          {/* --- Columna 2: Vista Previa (Tabla) --- */}
          <div className="space-y-4">
            {/* --- 4. TABLA DE VISTA PREVIA --- */}
            {fields.length > 0 && (
              <div className="overflow-x-auto">
                <h4 className="font-medium mb-2">Vista Previa de Variantes</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Imagen</TableHead>
                      <TableHead>Variante</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock</TableHead>
                      {/* --- INICIO DE LA ACTUALIZACIÓN --- */}
                      {/* <TableHead>Precio</TableHead> <-- Eliminado */}
                      {/* --- FIN DE LA ACTUALIZACIÓN --- */}
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        {/* Imagen */}
                        <TableCell>
                          <Controller
                            name={`variantes.${index}.foto`}
                            control={control}
                            render={({ field: imageField }) => (
                              <Label className="flex items-center justify-center w-16 h-16 border rounded-md cursor-pointer hover:bg-muted">
                                {uploadingIndex === index ? (
                                  <p className="text-xs">...</p>
                                ) : imageField.value ? (
                                  <Image src={imageField.value} alt="variante" width={64} height={64} className="object-cover" />
                                ) : (
                                  <UploadCloud className="h-6 w-6 text-muted-foreground" />
                                )}
                                <Input type="file" className="hidden" accept="image/*"
                                  onChange={(e) => handleVariantImageUpload(e, index)}
                                  disabled={uploadingIndex === index}
                                />
                              </Label>
                            )}
                          />
                        </TableCell>
                        
                        {/* Columna "Variante" */}
                        <TableCell className="font-medium">
                          {Object.values(watch(`variantes.${index}.opciones`)).join(' / ') || 'Default'}
                        </TableCell>
                        
                        {/* SKU */}
                        <TableCell>
                          <Input {...register(`variantes.${index}.sku`)} />
                          {/* @ts-ignore */}
                          {errors.variantes?.[index]?.sku && <p className="text-red-500 text-xs">{errors.variantes?.[index]?.sku?.message}</p>}
                        </TableCell>
                        
                        {/* Stock */}
                        <TableCell>
                          <Input type="number" {...register(`variantes.${index}.stock`, { valueAsNumber: true })} />
                          {/* @ts-ignore */}
                          {errors.variantes?.[index]?.stock && <p className="text-red-500 text-xs">{errors.variantes?.[index]?.stock?.message}</p>}
                        </TableCell>

                        {/* --- INICIO DE LA ACTUALIZACIÓN --- */}
                        {/* Celda de Precio Eliminada */}
                        {/* --- FIN DE LA ACTUALIZACIÓN --- */}

                        {/* Eliminar */}
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {/* @ts-ignore */}
            {errors.variantes && typeof errors.variantes === 'object' && !Array.isArray(errors.variantes) && <p className="text-red-500 text-sm">{errors.variantes.message}</p>}
          </div>
          {/* --- Fin Columna 2 --- */}

        </div>
        
      </CardContent>
    </Card>
  );
}

