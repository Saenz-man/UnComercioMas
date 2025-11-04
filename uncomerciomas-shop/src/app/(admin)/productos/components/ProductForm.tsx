'use client';

import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, CreateProductPayload } from '@/types/product.types';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';

import { DetallesPrincipales } from './DetallesPrincipales';
import { Multimedia } from './Multimedia';
import { OpcionesYVariantes } from './OpcionesYVariantes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// --- Definir el Schema (CORREGIDO) ---
const productFormSchema = z.object({
  nombre: z.string().min(3, 'El nombre es requerido'),
  precioPorPieza: z.number().min(0, 'El precio debe ser 0 o mayor'),
  categoria_id: z.string().min(1, 'Debes seleccionar una categoría'), // Cambiado a min(1) por si no es UUID
  slug: z.string().min(1, 'El slug es requerido'),
  modelo: z.string().nullable(),
  descripcion: z.string().nullable(),
  
  // --- CORRECCIÓN 1: 'fotos' debe ser un array de objetos ---
  fotos: z.array(z.object({
    value: z.string().url('URL de foto no válida'),
  })).min(1, 'Sube al menos una foto'),

  video: z.string().url().nullable().or(z.literal('')),
  
  preciosPorVolumen: z.array(z.object({
    cantidad_minima: z.number().min(1),
    precio: z.number().min(1),
  })).optional(),
  
  // --- CORRECCIÓN 2: Sintaxis de z.record() ---
  opciones: z.record(z.string(), z.array(z.string())), // { Talla: ['CH', 'M'] }
  
  variantes: z.array(z.object({
    sku: z.string().min(1, 'SKU requerido'),
    stock: z.number().min(0, 'Stock no puede ser negativo'),
    foto: z.string().url().nullable().or(z.literal('')),
    
    // --- CORRECIÓN 3: Sintaxis de z.record() ---
    opciones: z.record(z.string(), z.string()), // { Talla: 'CH', Color: 'Rojo' }
    precio: z.number().min(0).optional(),
  })).min(1, 'Debes generar al menos una variante'),
});

// --- Tipo inferido desde Zod (recomendado) ---
export type ProductFormData = z.infer<typeof productFormSchema>; // <--- ¡AÑADE "export" AQUÍ!


// --- Props del Formulario ---
interface ProductFormProps {
  initialData?: Product; 
}

// --- Valores por Defecto (Modo Crear) (CORREGIDO) ---
const defaultValues: ProductFormData = {
  nombre: '',
  modelo: null,
  descripcion: null,
  precioPorPieza: 0,
  categoria_id: '',
  slug: '',
  preciosPorVolumen: [],
  // --- CORRECCIÓN 4: 'fotos' es un array de objetos ---
  fotos: [], 
  video: null,
  opciones: {},
  variantes: [],
};

// --- Función para transformar Data de API a Data de Formulario (CORREGIDO) ---
const transformProductToPayload = (product: Product): ProductFormData => {
  return {
    nombre: product.nombre,
    modelo: product.modelo,
    descripcion: product.descripcion,
    precioPorPieza: parseFloat(product.precioPorPieza) || 0,
    categoria_id: product.categoria.id,
    slug: product.slug,
    
    // --- CORRECCIÓN 5: Mapear string[] a { value: string }[] ---
    fotos: product.fotos.map(url => ({ value: url })), 
    
    video: product.video,
    opciones: product.opciones,
    preciosPorVolumen: product.preciosPorVolumen.map(pv => ({
      cantidad_minima: pv.cantidad_minima,
      precio: parseFloat(pv.precio) || 0,
    })),
    variantes: product.variantes.map(v => ({
      sku: v.sku,
      stock: v.stock,
      foto: v.foto_variante, 
      opciones: v.atributos, 
      precio: parseFloat(v.precio) || 0,
    })),
  };
};


// --- EL COMPONENTE ---
export function ProductForm({ initialData }: ProductFormProps) {
  const isEditMode = !!initialData;

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  const methods = useForm<ProductFormData>({ // Usar el tipo inferido
    resolver: zodResolver(productFormSchema), // ¡Validación activada!
    defaultValues: isEditMode ? transformProductToPayload(initialData) : defaultValues,
  });
type ProductFormData = z.infer<typeof productFormSchema>;
  // 3. Handler de Submit
  // El 'data' ya está validado y tipado por Zod
  const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    
    // --- CORRECCIÓN 6: Transformar 'fotos' de vuelta a string[] para la API ---
    const payload: CreateProductPayload = {
      ...data,
      fotos: data.fotos.map(fotoObj => fotoObj.value),
    };
    
    console.log('Payload enviado a la API:', payload);

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
            {/* Aquí pasamos props para que DetallesPrincipales
                pueda cargar las categorías */}
            <DetallesPrincipales />
            <OpcionesYVariantes />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Multimedia />
          </div>
        </div>

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
                <p>Por favor, revisa los errores en el formulario:</p>
                {/* Descomenta para debuggear errores de Zod */}
                {/* <pre className="text-xs">
                  {JSON.stringify(methods.formState.errors, null, 2)}
                </pre> */}
              </div>
            )}
          </CardContent>
        </Card>

      </form>
    </FormProvider>
  );
}
