'use client';

import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, CreateProductPayload } from '@/types/product.types';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';

// Importa tus componentes hijos
import { DetallesPrincipales } from './DetallesPrincipales';
import { Multimedia } from './Multimedia';
import { OpcionesYVariantes } from './OpcionesYVariantes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// --- Definir el Schema (validación opcional pero RECOMENDADA) ---
const productFormSchema = z.object({
  nombre: z.string().min(3, 'El nombre es requerido'),
  precioPorPieza: z.number().min(0, 'El precio debe ser 0 o mayor'),
  categoria_id: z.string().min(1, 'Debes seleccionar una categoría'),
  slug: z.string().min(1, 'El slug es requerido'),
  modelo: z.string().nullable(),
  descripcion: z.string().nullable(),
  
  fotos: z.array(z.object({
    value: z.string().url('URL de foto no válida'),
  })).min(1, 'Sube al menos una foto'),

  video: z.string().url().nullable().or(z.literal('')),
  
  preciosPorVolumen: z.array(z.object({
    cantidad_minima: z.number().min(1),
    precio: z.number().min(1),
  })).optional(),
  
  opciones: z.record(z.string(), z.array(z.string())), // { Talla: ['CH', 'M'] }
  
  variantes: z.array(z.object({
    sku: z.string().min(1, 'SKU requerido'),
    stock: z.number().min(0, 'Stock no puede ser negativo'),
    foto: z.string().url().nullable().or(z.literal('')),
    opciones: z.record(z.string(), z.string()), // { Talla: 'CH', Color: 'Rojo' }
    precio: z.number().min(0).optional(),
  })).min(1, 'Debes generar al menos una variante'),
});


// --- Tipo inferido desde Zod (recomendado) ---
export type ProductFormData = z.infer<typeof productFormSchema>;


// --- Props del Formulario ---
interface ProductFormProps {
  initialData?: Product; 
}

// --- Valores por Defecto (Modo Crear) ---
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

// --- Función para transformar Data de API a Data de Formulario ---
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

  const methods = useForm<ProductFormData>({ 
    resolver: zodResolver(productFormSchema), 
    defaultValues: isEditMode ? transformProductToPayload(initialData) : defaultValues,
  });

  const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    
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
        
        {/* --- INICIO DE LA ACTUALIZACIÓN DE DISEÑO --- */}
        {/* Grid solo para Detalles y Multimedia */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Principal (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <DetallesPrincipales />
            {/* 'OpcionesYVariantes' ya NO va aquí */}
          </div>

          {/* Columna Lateral (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <Multimedia />
          </div>
        </div>
        {/* --- FIN DE LA ACTUALIZACIÓN DE DISEÑO --- */}

        {/* 'OpcionesYVariantes' ahora es un hermano del grid
            y ocupará el ancho completo */}
        <OpcionesYVariantes />

        {/* Botón de Guardado */}
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

