'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { ProductFormData } from './ProductForm'; 
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUpload } from '@/hooks/useUpload';
// --- INICIO: NUEVAS IMPORTACIONES ---
import { useCreateVariant, useDeleteVariant } from '@/hooks/useProductVariants';
import { toast } from 'sonner';
// --- FIN: NUEVAS IMPORTACIONES ---
// --- INICIO: CORRECCIÓN DE TIPO FALTANTE ---
import type { CreateProductVariantPayload } from '@/types/product-variant.types';
// --- FIN: CORRECCIÓN DE TIPO FALTANTE ---
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, UploadCloud, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// --- INICIO: PROPS DEL COMPONENTE ---
interface OpcionesYVariantesProps {
  productId?: string; // ID del producto, solo existe en modo Edición
}
// --- FIN: PROPS DEL COMPONENTE ---

interface OptionDefinition {
  name: string;
  values: string[]; 
}

function cartesian<T>(...arrays: T[][]): T[][] {
  // ... (función sin cambios)
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

// --- INICIO: NUEVA FUNCIÓN HELPER ---
/**
 * Crea una clave única para una variante basada en sus opciones,
 * asegurando que el orden no importe.
 * Ej: { Talla: "M", Color: "Rojo" } -> "color:rojo,talla:m"
 */
const createVariantKey = (opciones: Record<string, string>): string => {
  return Object.keys(opciones)
    .sort()
    .map(key => `${key.toLowerCase()}:${opciones[key].toLowerCase()}`)
    .join(',');
};
// --- FIN: NUEVA FUNCIÓN HELPER ---

const defaultOptionDefs: OptionDefinition[] = [
  { name: 'Talla', values: ['Ch', 'M', 'G'] },
  { name: 'Color', values: ['Blanco', 'Negro'] }
];

// --- INICIO: COMPONENTE ACTUALIZADO ---
export function OpcionesYVariantes({ productId }: OpcionesYVariantesProps) {
  const { control, watch, setValue, getValues, register, formState: { errors } } = useFormContext<ProductFormData>();
  
  const isEditMode = !!productId; // <-- ¡Ahora sabemos si estamos en modo Edición!

  // --- INICIO: LÓGICA DE ESTADO (MODIFICADA) ---
  // Función para leer las opciones iniciales desde el formulario
  const getInitialDefs = () => {
    const formOptions = getValues('opciones');
    if (formOptions && Object.keys(formOptions).length > 0) {
      return Object.entries(formOptions).map(([name, values]) => ({
        name,
        values,
      }));
    }
    // Si no hay opciones, decidir en base al modo
    return isEditMode ? [] : defaultOptionDefs;
  };

  // Determinar si el producto (en edición) tiene opciones
  const initialHasOptions = () => {
    if (!isEditMode) return true; // Default para 'Crear'
    const variants = getValues('variantes');
    if (variants.length === 0) return false;
    if (variants.length === 1 && Object.keys(variants[0].opciones).length === 0) return false;
    return true; // Tiene más de 1 variante o la única variante tiene opciones
  };
  
  const [hasOptions, setHasOptions] = useState(initialHasOptions());
  const [optionDefs, setOptionDefs] = useState<OptionDefinition[]>(getInitialDefs());
  const [currentTagValues, setCurrentTagValues] = useState<Record<number, string>>({});
  // --- FIN: LÓGICA DE ESTADO (MODIFICADA) ---

  const { fields, replace, remove, append } = useFieldArray({
    control,
    name: 'variantes',
  });
  
  // --- INICIO: NUEVOS HOOKS DE MUTACIÓN ---
  const createVariantMutation = useCreateVariant(productId);
  const deleteVariantMutation = useDeleteVariant(productId);
  const uploadMutation = useUpload();
  // --- FIN: NUEVOS HOOKS DE MUTACIÓN ---

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

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
  
  // --- INICIO: LÓGICA DE GENERACIÓN (¡ACTUALIZADA!) ---
  const handleGenerateVariants = () => {
    // --- Lógica de "Generar Payload de Variantes" (común para ambos modos) ---
    let newVariantsPayloads: (ProductFormData['variantes'][0])[] = [];
    
    if (!hasOptions) {
      newVariantsPayloads = [{
        sku: '', stock: 0, foto: null, opciones: {}, precio: getValues('precioPorPieza') || 0,
      }];
      setValue('opciones', {});
    } else {
      const validOptions = optionDefs.filter(opt => opt.name.trim() && opt.values.length > 0);
      if (validOptions.length === 0) {
        newVariantsPayloads = [{
          sku: '', stock: 0, foto: null, opciones: {}, precio: getValues('precioPorPieza') || 0,
        }];
        setValue('opciones', {});
      } else {
        const rhfOptions: Record<string, string[]> = {};
        const valueArrays: string[][] = [];
        validOptions.forEach(opt => {
          rhfOptions[opt.name] = opt.values; 
          valueArrays.push(opt.values);
        });
        setValue('opciones', rhfOptions, { shouldValidate: true });

        const combinations = cartesian(...valueArrays);
        newVariantsPayloads = combinations.map(combo => {
          const variantOptions: Record<string, string> = {};
          const skuParts: string[] = [];
          combo.forEach((value, index) => {
            const optionName = validOptions[index].name;
            variantOptions[optionName] = value;
            skuParts.push(value);
          });
          const baseSku = (getValues('nombre') || 'PROD').substring(0, 5).toUpperCase().replace(/\s+/g, '-');
          const variantSku = skuParts.join('-').toUpperCase().replace(/\s+/g, '-');
          return {
            sku: `${baseSku}-${variantSku}`,
            stock: 0, // Stock inicial 0 para nuevas variantes
            foto: null,
            opciones: variantOptions,
            precio: getValues('precioPorPieza') || 0,
          };
        });
      }
    }

    // --- ¡AQUÍ ESTÁ LA NUEVA LÓGICA! ---

    if (isEditMode && productId) {
      // --- MODO EDICIÓN: Reconciliar ---
      console.log("Modo Edición: Reconciliando variantes...");

      // 1. Obtener variantes actuales del formulario (que tienen ID de DB)
      const existingVariants = getValues('variantes');
      const existingKeys = new Map(
        existingVariants.map(v => [createVariantKey(v.opciones), v])
      );
      
      // 2. Crear mapa de variantes deseadas
      const desiredKeys = new Map(
        newVariantsPayloads.map(p => [createVariantKey(p.opciones), p])
      );

      // 3. Encontrar variantes PARA AÑADIR
      const variantsToAdd: CreateProductVariantPayload[] = [];
      desiredKeys.forEach((payload, key) => {
        if (!existingKeys.has(key)) {
          // ¡Esta es una variante nueva!
          // Le quitamos el 'id' (que es undefined) por si acaso
          const { id, ...payloadSinId } = payload; 
          variantsToAdd.push(payloadSinId);
        }
      });

      // 4. Encontrar variantes PARA ELIMINAR
      const variantsToRemove: (ProductFormData['variantes'][0])[] = [];
      existingKeys.forEach((variant, key) => {
        if (!desiredKeys.has(key) && variant.id) {
          // ¡Esta variante ya no existe en las opciones!
          variantsToRemove.push(variant);
        }
      });
      
      // 5. Ejecutar mutaciones
      if (variantsToAdd.length > 0) {
        toast.info(`Añadiendo ${variantsToAdd.length} variantes nuevas...`);
        const createPromises = variantsToAdd.map(payload => 
          createVariantMutation.mutateAsync(payload)
        );
        // Esperamos a que todas se creen
        Promise.allSettled(createPromises).then(() => {
          toast.success("Variantes nuevas añadidas.");
          // NOTA: Confiamos en que onSuccess de useCreateVariant invalide
          // la query ['product', productId] y refresque la tabla.
        });
      }
      
      if (variantsToRemove.length > 0) {
        toast.info(`Eliminando ${variantsToRemove.length} variantes obsoletas...`);
        const deletePromises = variantsToRemove.map(variant =>
          deleteVariantMutation.mutateAsync(variant.id!)
        );
        Promise.allSettled(deletePromises).then(() => {
          toast.success("Variantes obsoletas eliminadas.");
        });
      }
      
      if(variantsToAdd.length === 0 && variantsToRemove.length === 0) {
        toast.info("No hay cambios en las variantes.");
      }
      
      // En modo Edición, NO usamos 'replace'.
      // Confiamos en que 'useCreateVariant' y 'useDeleteVariant'
      // invalidarán la query de ['product', productId] y
      // RHF se actualizará solo.

    } else {
      // --- MODO CREACIÓN: Reemplazar todo (lógica antigua) ---
      console.log("Modo Creación: Reemplazando variantes.");
      replace(newVariantsPayloads);
    }
  };
  // --- FIN: LÓGICA DE GENERACIÓN ---


  const handleOptionsToggle = (checked: boolean) => {
    setHasOptions(checked as boolean);
    if (checked as boolean) {
      if(optionDefs.length === 0) {
        setOptionDefs(defaultOptionDefs);
      }
    } else {
      setOptionDefs([]);
      // No llamar a handleGenerateVariants aquí, esperar a que el usuario confirme
    }
  };
  
  const handleVariantImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    // ... (sin cambios)
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIndex(index);
    uploadMutation.mutate(file, {
      onSuccess: (url) => {
        setValue(`variantes.${index}.foto`, url, { shouldValidate: true });
        // TODO: Aquí deberíamos llamar a useUpdateVariant para la foto
        // Por ahora, el usuario debe dar "Guardar Cambios"
        setUploadingIndex(null);
      },
      onError: () => setUploadingIndex(null),
    });
  };

  // --- INICIO: NUEVO HANDLER DE ELIMINAR ---
  const handleDeleteVariant = (index: number) => {
    const variant = getValues(`variantes.${index}`);
    
    if (isEditMode && variant.id) {
      // Modo Edición: Llamar a la API
      toast.warning(`Eliminando variante ${variant.sku}...`);
      deleteVariantMutation.mutate(variant.id, {
        onSuccess: () => {
          // Ya no necesitamos 'remove(index)' porque
          // useDeleteVariant debe invalidar la query y refrescar la UI.
          toast.success("Variante eliminada.");
        },
        onError: () => {
          toast.error("Error al eliminar la variante.");
        }
      });
    } else {
      // Modo Creación: Solo quitar de RHF
      remove(index);
    }
  };
  // --- FIN: NUEVO HANDLER DE ELIMINAR ---

  const updateOptionName = (index: number, name: string) => {
    // ... (sin cambios)
    const newDefs = [...optionDefs];
    newDefs[index].name = name;
    setOptionDefs(newDefs);
  };
  
  const updateTagInputValue = (index: number, value: string) => {
    // ... (sin cambios)
    setCurrentTagValues(prev => ({ ...prev, [index]: value }));
  };

  const addOptionDef = () => setOptionDefs([...optionDefs, { name: '', values: [] }]);
  const removeOptionDef = (index: number) => setOptionDefs(optionDefs.filter((_, i) => i !== index));

  // --- INICIO: OBTENER ESTADO DE CARGA ---
  const isGenerating = createVariantMutation.isPending || deleteVariantMutation.isPending;
  // --- FIN: OBTENER ESTADO DE CARGA ---

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opciones y Variantes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* --- Columna 1: Formulario de Opciones --- */}
          <div className="space-y-6">
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
                    
                    {/* --- INICIO: CORRECCIÓN DE TAILWIND --- */}
                    <div className="flex flex-wrap gap-2 min-h-10 p-2 border rounded-md bg-muted/50">
                    {/* --- FIN: CORRECCIÓN DE TAILWIND --- */}
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

            <Button 
              type="button" 
              onClick={handleGenerateVariants}
              disabled={isGenerating} // <-- Deshabilitar mientras genera
            >
              {isGenerating ? 'Generando...' : 'Generar Variantes'}
            </Button>
          </div>
          {/* --- Fin Columna 1 --- */}

          {/* --- Columna 2: Vista Previa (Tabla) --- */}
          <div className="space-y-4">
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
                        
                        <TableCell className="font-medium">
                          {Object.values(watch(`variantes.${index}.opciones`)).join(' / ') || 'Default'}
                        </TableCell>
                        
                        {/* SKU (TODO: Añadir onBlur para actualizar) */}
                        <TableCell>
                          <Input {...register(`variantes.${index}.sku`)} />
                          {/* @ts-ignore */}
                          {errors.variantes?.[index]?.sku && <p className="text-red-500 text-xs">{errors.variantes?.[index]?.sku?.message}</p>}
                        </TableCell>
                        
                        {/* Stock (TODO: Añadir onBlur para actualizar) */}
                        <TableCell>
                          <Input type="number" {...register(`variantes.${index}.stock`, { valueAsNumber: true })} />
                          {/* @ts-ignore */}
                          {errors.variantes?.[index]?.stock && <p className="text-red-500 text-xs">{errors.variantes?.[index]?.stock?.message}</p>}
                        </TableCell>

                        {/* --- INICIO: BOTÓN DE ELIMINAR ACTUALIZADO --- */}
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteVariant(index)}
                            disabled={deleteVariantMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                        {/* --- FIN: BOTÓN DE ELIMINAR ACTUALIZADO --- */}
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
// --- FIN: COMPONENTE ACTUALIZADO ---

