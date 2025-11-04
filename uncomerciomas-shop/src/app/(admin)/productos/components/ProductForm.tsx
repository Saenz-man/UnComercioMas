'use client';

// --- INICIO: CORRECCIÓN ---
import { useEffect } from 'react';
// --- FIN: CORRECCIÓN ---
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, CreateProductPayload } from '@/types/product.types';
// --- INICIO: CORRECCIÓN ---
// Importamos useProduct para obtener datos "vivos"
import { useCreateProduct, useUpdateProduct, useProduct } from '@/hooks/useProducts';
// --- FIN: CORRECCIÓN ---

import { DetallesPrincipales } from './DetallesPrincipales';
import { Multimedia } from './Multimedia';
import { OpcionesYVariantes } from './OpcionesYVariantes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// --- Esquema de Zod (sin cambios) ---
const productFormSchema = z.object({
  nombre: z.string().min(3, 'El nombre es requerido'),
  precioPorPieza: z.number().min(0, 'El precio debe ser 0 o mayor'),
  categoria_id: z.string().min(1, 'Debes seleccionar una categoría'), 
  slug: z.string().min(1, 'El slug es requerido'),
  modelo: z.string().nullable(),
  descripcion: z.string().nullable(),
  fotos: z.array(z.object({ value: z.string().url('URL de foto no válida'), })).min(1, 'Sube al menos una foto'),
  video: z.string().url().nullable().or(z.literal('')),
  preciosPorVolumen: z.array(z.object({ cantidad_minima: z.number().min(1), precio: z.number().min(1), })).optional(),
  opciones: z.record(z.string(), z.array(z.string())),
  variantes: z.array(z.object({
    id: z.string().optional(), 
    sku: z.string().min(1, 'SKU requerido'),
    stock: z.number().min(0, 'Stock no puede ser negativo'),
    foto: z.string().url().nullable().or(z.literal('')),
    opciones: z.record(z.string(), z.string()),
    precio: z.number().min(0).optional(),
  })).min(1, 'Debes generar al menos una variante'),
});

export type ProductFormData = z.infer<typeof productFormSchema>;


interface ProductFormProps {
  initialData?: Product; 
}

const defaultValues: ProductFormData = {
  nombre: '',
  modelo: null,
  descripcion: null,
  precioPorPieza: 0,
  categoria_id: '',
  slug: '',
  preciosPorVolumen: [],
  fotos: [], 
  video: null,
  opciones: {},
  variantes: [],
};

// --- Función de Transformación (sin cambios) ---
const transformProductToPayload = (product: Product): ProductFormData => {
  return {
    nombre: product.nombre,
    modelo: product.modelo,
    descripcion: product.descripcion,
    precioPorPieza: parseFloat(product.precioPorPieza) || 0,
    categoria_id: product.categoria.id,
    slug: product.slug,
    fotos: product.fotos.map(url => ({ value: url })), 
    video: product.video,
    opciones: product.opciones,
    preciosPorVolumen: product.preciosPorVolumen.map(pv => ({
      cantidad_minima: pv.cantidad_minima,
      precio: parseFloat(pv.precio) || 0,
    })),
    variantes: product.variantes.map(v => ({
      id: v.id, 
      sku: v.sku,
      stock: v.stock,
      foto: v.foto_variante, 
      opciones: v.atributos, 
      precio: parseFloat(v.precio) || 0,
    })),
  };
};


export function ProductForm({ initialData }: ProductFormProps) {
  const isEditMode = !!initialData;
  // --- INICIO: CORRECCIÓN ---
  const productId = initialData?.id; // Obtenemos el ID para el hook
  // --- FIN: CORRECCIÓN ---

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  const methods = useForm<ProductFormData>({ 
    resolver: zodResolver(productFormSchema), 
    // Usamos 'initialData' (del servidor) SOLO para la carga inicial
    defaultValues: isEditMode ? transformProductToPayload(initialData!) : defaultValues,
  });

  // --- INICIO: CORRECCIÓN "LA TABLA NO SE REFRESCA" ---
  const { reset } = methods; // Obtener la función 'reset' de useForm

  // 1. Llamamos a useProduct para obtener datos "vivos" del cliente
  // 'initialData' se usa como placeholder mientras 'useProduct' carga
  const { data: liveProductData } = useProduct(productId);

  useEffect(() => {
    // 2. Este efecto vigila 'liveProductData' (los datos del hook)
    if (liveProductData) {
      // 3. Cuando 'liveProductData' cambia (después de la invalidación),
      // reseteamos el formulario con los datos MÁS NUEVOS.
      console.log("Datos 'vivos' del producto actualizados, reseteando formulario...");
      reset(transformProductToPayload(liveProductData));
    }
  }, [liveProductData, reset]); // El trigger ahora es 'liveProductData'
  // --- FIN: CORRECCIÓN "LA TABLA NO SE REFRESCA" ---

  const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    // ... (sin cambios)
    const payload: CreateProductPayload = {
      ...data,
      fotos: data.fotos.map(fotoObj => fotoObj.value),
    };
    
    console.log('Payload enviado:', payload);

    if (isEditMode) {
      updateProductMutation.mutate({
        productId: initialData.id,
        updateData: payload,
      });
    } else {
      createProductMutation.mutate(payload);
    }
  };
  
  const isLoading = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DetallesPrincipales />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Multimedia />
          </div>
        </div>
        
        <OpcionesYVariantes productId={initialData?.id} />

        <Card>
          <CardContent className="pt-6">
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (isEditMode ? 'Actualizando...' : 'Creando...')
                : (isEditMode ? 'Guardar Cambios' : 'Crear Producto')
              }
            </Button>
            {Object.keys(methods.formState.errors).length > 0 && (
              <div className="text-red-500 text-sm mt-4">
                <p>Por favor, revisa los errores en el formulario.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </form>
    </FormProvider>
  );
}

