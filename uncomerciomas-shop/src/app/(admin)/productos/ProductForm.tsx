// src/components/admin/products/ProductForm.tsx
"use client";

import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Hooks, tipos y servicios
import { useCategories, useCreateCategory } from '@/hooks/useCategories';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import type { Product } from '@/types/product.types';
import type { ProductPayload } from '@/services/product.service';
import type { VolumePricePayload } from '@/types/volume-price.types';
import type { Category } from '@/types/category.types';
import type { CategoryPayload } from '@/services/category.service';
import { CategoryForm } from '../categorias/CategoryForm'; // Asegúrate que la ruta sea correcta
import { cn } from '@/lib/utils';

// --- Schemas (Versión funcional anterior - SIN CAMBIOS LÓGICOS) ---
const volumePriceInputSchema = z.object({
  cantidad_minima: z.string().min(1, 'Requerida').regex(/^\d+$/,{message:'Inválido'}).refine(v => parseInt(v) > 0, { message: '> 0'}),
  precio: z.string().min(1, 'Requerido').regex(/^\d+(\.\d{1,2})?$/,{message:'Inválido'}).refine(v => parseFloat(v) > 0, { message: '> 0'}),
});
const optionSchema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  valores: z.string().min(1, 'Requerido'),
});
const photoSchema = z.object({
  url: z.string().url('URL inválida').min(1, 'Requerida'),
});
const productInputSchema = z.object({
  nombre: z.string().min(3, 'Nombre muy corto'),
  slug: z.string().min(3, 'Slug inválido').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,{message:'Solo minúsculas, números y guiones'}),
  descripcion: z.string().trim().optional(),
  precio_base: z.string().min(1, 'Requerido').regex(/^\d+(\.\d{1,2})?$/, { message: 'Formato inválido (ej: 100.00)' }).refine(v => parseFloat(v) > 0, { message: 'Debe ser positivo' }),
  categoria_id: z.string().uuid('Inválido').min(1, 'Requerido'),
  video: z.string().url('URL inválida').optional().or(z.literal('')),
  fotos: z.array(photoSchema), // Quitamos .default([])
  preciosPorVolumen: z.array(volumePriceInputSchema), // Quitamos .default([])
  opciones: z.array(optionSchema), // Quitamos .default([])
});
// --- FIN Schemas ---

type ProductFormData = z.infer<typeof productInputSchema>;
interface ProductFormProps { initialData?: Product | null; }

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const isEditMode = !!initialData;

  const { data: categories = [], isLoading: isLoadingCategories, refetch: refetchCategories } = useCategories();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const createCategoryMutation = useCreateCategory();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // --- useForm (Asegurando defaults explícitos) ---
  const {
    register, handleSubmit, reset, control, setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productInputSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      slug: initialData?.slug || '',
      descripcion: initialData?.descripcion || '',
      precio_base: initialData?.precio_base != null ? String(initialData.precio_base) : '',
      categoria_id: initialData?.categoria?.id || '',
      video: initialData?.video || '',
      fotos: initialData?.fotos ? initialData.fotos.map(url => ({ url })) : [], // Siempre array
      preciosPorVolumen: initialData?.preciosPorVolumen ? initialData.preciosPorVolumen.map(p => ({
        cantidad_minima: String(p.cantidad_minima),
        precio: String(p.precio)
      })) : [], // Siempre array
      opciones: initialData?.opciones
        ? Object.entries(initialData.opciones).map(([key, value]) => ({ nombre: key, valores: value.join(', ') }))
        : [], // Siempre array
    },
  });
  // --- FIN useForm ---

  const { fields: volumeFields, append: appendVolume, remove: removeVolume } = useFieldArray({ control, name: "preciosPorVolumen" });
  const { fields: photoFields, append: appendPhoto, remove: removePhoto } = useFieldArray({ control, name: "fotos" });
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({ control, name: "opciones" });

  // useEffect (Reset con arrays explícitos)
  useEffect(() => {
     reset({
       nombre: initialData?.nombre || '',
       slug: initialData?.slug || '',
       descripcion: initialData?.descripcion || '',
       precio_base: initialData?.precio_base != null ? String(initialData.precio_base) : '',
       categoria_id: initialData?.categoria?.id || '',
       video: initialData?.video || '',
       fotos: initialData?.fotos ? initialData.fotos.map(url => ({ url })) : [],
       preciosPorVolumen: initialData?.preciosPorVolumen ? initialData.preciosPorVolumen.map(p => ({
         cantidad_minima: String(p.cantidad_minima),
         precio: String(p.precio)
       })) : [],
       opciones: initialData?.opciones ? Object.entries(initialData.opciones).map(([key, value]) => ({ nombre: key, valores: value.join(', ') })) : [],
     });
  }, [initialData, reset]);


  const handleCreateCategorySubmit = (categoryData: CategoryPayload) => { /* ... como antes ... */ };

  // onSubmit (CON CONVERSIÓN MANUAL - SIN CAMBIOS LÓGICOS)
  const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    console.log("Form data (strings):", data);
    try {
      // --- Conversiones ---
      const precioBaseNum = parseFloat(data.precio_base);
      const preciosVolumenNum: VolumePricePayload[] = (data.preciosPorVolumen || []).map(p => { const cantMin = parseInt(p.cantidad_minima, 10); const precio = parseFloat(p.precio); if (isNaN(cantMin) || isNaN(precio) || cantMin <= 0 || precio <= 0) throw new Error(`Precio por volumen inválido: ${JSON.stringify(p)}`); return { cantidad_minima: cantMin, precio: precio }; });
      const opcionesObjeto = (data.opciones || []).reduce((acc, opcion) => { if (opcion.nombre && opcion.valores) { const valoresArray = opcion.valores.split(',').map(v => v.trim()).filter(Boolean); if (valoresArray.length > 0) acc[opcion.nombre.trim()] = valoresArray; } return acc; }, {} as Record<string, string[]>);
      const fotosUrls = (data.fotos || []).map(f => f.url).filter(Boolean);
      // --- Fin Conversiones ---

      if (isNaN(precioBaseNum) || precioBaseNum <= 0) throw new Error('Precio base inválido.');

      const payload: ProductPayload = {
        nombre: data.nombre, slug: data.slug, descripcion: data.descripcion || undefined,
        precio_base: precioBaseNum, categoria_id: data.categoria_id, video: data.video || undefined,
        fotos: fotosUrls, preciosPorVolumen: preciosVolumenNum, opciones: opcionesObjeto,
      };
      console.log("Payload to send:", payload);

      // Mutaciones
      const mutation = isEditMode ? updateProductMutation : createProductMutation;
      const mutationPayload = isEditMode ? { id: initialData!.id, payload } : payload;
      mutation.mutate(mutationPayload as any, {
        onSuccess: () => {
          alert(`Producto ${isEditMode ? 'actualizado' : 'creado'} con éxito!`);
          router.push('/productos');
          router.refresh();
        },
        onError: (error: any) => {
          alert(`Error al ${isEditMode ? 'actualizar' : 'crear'}: ${error.response?.data?.message || error.message}`);
        },
       });

    } catch (conversionError: any) {
        console.error("Error convirtiendo datos:", conversionError);
        alert(`Error en los datos: ${conversionError.message}`);
    }
  };

  const isLoadingMutation = createProductMutation.isPending || updateProductMutation.isPending || createCategoryMutation.isPending;

  // --- JSX REESTRUCTURADO Y ESTILIZADO ---
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-md space-y-8 max-w-4xl mx-auto">
      {/* Estilos */}
      <style jsx global>{`
        .input-label { @apply block text-sm font-medium text-gray-700 mb-1; }
        .input-field { @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out; }
        .input-field-sm { @apply block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-xs transition duration-150 ease-in-out; }
        .input-error { @apply border-red-500 focus:ring-red-500 focus:border-red-500; }
        .error-message { @apply mt-1 text-xs text-red-600; }
        .form-section { @apply pt-8 mt-8 border-t border-gray-200; }
        .form-section:first-child { @apply pt-0 mt-0 border-t-0; }
        .form-section-title { @apply text-base font-semibold leading-6 text-gray-900 mb-4 border-b border-gray-200 pb-2; }
        .btn-secondary { @apply px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50; }
        .btn-danger-sm { @apply text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50; }
        .btn-primary-sm { @apply text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 border border-indigo-300 px-3 py-1 rounded-md bg-white hover:bg-indigo-50 transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50; }
        .btn-primary { @apply px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-md shadow hover:from-blue-600 hover:to-indigo-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[150px]; }
        .btn-cancel { @apply px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 transition duration-150 disabled:opacity-50; }
        .icon-sm { @apply w-4 h-4; }
        .icon-md { @apply w-5 h-5; }
      `}</style>

      {/* --- Grupo: Información General --- */}
      <div>
        <h3 className="form-section-title">Información General</h3>
        <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
          {/* Nombre */}
          <div className="sm:col-span-4">
            <label htmlFor="nombre" className="input-label">Nombre *</label>
            <input id="nombre" {...register('nombre')} className={cn('input-field', errors.nombre && 'input-error')} />
            {errors.nombre && <p className="error-message">{errors.nombre.message}</p>}
          </div>
          {/* Slug */}
          <div className="sm:col-span-2">
             <label htmlFor="slug" className="input-label">Slug (URL) *</label>
             <input id="slug" {...register('slug')} className={cn('input-field', errors.slug && 'input-error')} placeholder="nombre-producto"/>
             {errors.slug && <p className="error-message">{errors.slug.message}</p>}
          </div>
          {/* Descripción */}
          <div className="sm:col-span-6">
            <label htmlFor="descripcion" className="input-label">Descripción</label>
            <textarea id="descripcion" {...register('descripcion')} rows={4} className={cn('input-field', errors.descripcion && 'input-error')} />
            {errors.descripcion && <p className="error-message">{errors.descripcion.message}</p>}
          </div>
          {/* Categoría */}
          <div className="sm:col-span-6">
              <label htmlFor="categoria_id" className="input-label">Categoría *</label>
              <div className="flex items-center gap-2 mt-1">
                <select id="categoria_id" {...register('categoria_id')} className={cn('input-field flex-grow', errors.categoria_id && 'input-error')} disabled={isLoadingCategories}>
                  <option value="">-- Selecciona --</option>
                  {categories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.nombre}</option> ))}
                </select>
                <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="btn-secondary whitespace-nowrap" title="Crear Categoría" disabled={isLoadingCategories || createCategoryMutation.isPending} > Nueva </button>
              </div>
              {isLoadingCategories && <p className="text-xs text-gray-500 mt-1">Cargando...</p>}
              {errors.categoria_id && <p className="error-message">{errors.categoria_id.message}</p>}
          </div>
        </div>
      </div>

       {/* --- Grupo: Precios --- */}
       <div className="form-section">
        <h3 className="form-section-title">Precios</h3>
        <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6 items-start">
          {/* Precio Base */}
          <div className="sm:col-span-2">
             <label htmlFor="precio_base" className="input-label">Precio por Pieza *</label>
             <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 sm:text-sm">$</span>
                <input id="precio_base" type="text" inputMode="decimal" {...register('precio_base')} className={cn('input-field pl-7 pr-12', errors.precio_base && 'input-error')} placeholder="0.00"/>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 sm:text-sm">MXN</span>
             </div>
             {errors.precio_base && <p className="error-message">{errors.precio_base.message}</p>}
          </div>
          {/* Precios por Volumen */}
          <div className="sm:col-span-4 space-y-3">
             <label className="block text-sm font-medium text-gray-700">Precios por Volumen (Ej: Caja, Distribuidor)</label>
             {volumeFields.length > 0 ? volumeFields.map((field, index) => (
               <div key={field.id} className="flex items-end gap-3 p-3 border rounded-md bg-gray-50/50">
                   <div className="flex-grow">
                     <label htmlFor={`vol_${index}_cant`} className="block text-xs font-medium text-gray-500 mb-1"> Si compra al menos * </label>
                     <input id={`vol_${index}_cant`} type="number" step="1" min="1" {...register(`preciosPorVolumen.${index}.cantidad_minima`)} className={cn('input-field-sm', errors.preciosPorVolumen?.[index]?.cantidad_minima && 'input-error')} placeholder="Ej: 10"/>
                     {errors.preciosPorVolumen?.[index]?.cantidad_minima && <p className="error-message text-xs">{errors.preciosPorVolumen[index]?.cantidad_minima?.message}</p>}
                   </div>
                   <span className="text-gray-500 text-sm pb-1">piezas,</span>
                   <div className="flex-grow">
                     <label htmlFor={`vol_${index}_prec`} className="block text-xs font-medium text-gray-500 mb-1"> el precio unitario es * </label>
                     <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400 text-xs">$</span>
                        <input id={`vol_${index}_prec`} type="text" inputMode="decimal" {...register(`preciosPorVolumen.${index}.precio`)} className={cn('input-field-sm pl-5', errors.preciosPorVolumen?.[index]?.precio && 'input-error')} placeholder="Ej: 90.00"/>
                     </div>
                     {errors.preciosPorVolumen?.[index]?.precio && <p className="error-message text-xs">{errors.preciosPorVolumen[index]?.precio?.message}</p>}
                   </div>
                   <button type="button" onClick={() => removeVolume(index)} className="btn-danger-sm mb-1" title="Eliminar"><TrashIcon /></button>
               </div>
             )) : <p className="text-xs text-gray-400 italic mt-1">No hay precios por volumen definidos.</p>}
             <button type="button" onClick={() => appendVolume({ cantidad_minima: '', precio: '' })} className="btn-primary-sm" > <PlusIcon/> Añadir Nivel </button>
             {(errors.preciosPorVolumen && !Array.isArray(errors.preciosPorVolumen)) && <p className="error-message">{errors.preciosPorVolumen.message}</p>}
          </div>
        </div>
       </div>

       {/* --- Grupo: Multimedia --- */}
       <div className="form-section">
         <h3 className="form-section-title">Multimedia</h3>
         <div className="grid grid-cols-1 gap-y-6 gap-x-6">
            {/* Fotos URLs */}
            <div className="space-y-3">
                <label className="input-label">Fotos Genéricas (URLs)</label>
                {photoFields.length > 0 ? photoFields.map((field, index) => (
                   <div key={field.id} className="flex items-center gap-3">
                     <input placeholder="https://" {...register(`fotos.${index}.url` as const)} className={cn('input-field flex-1', errors.fotos?.[index]?.url && 'input-error')} />
                     <button type="button" onClick={() => removePhoto(index)} className="btn-danger-sm" title="Eliminar" > <TrashIcon/> </button>
                     {errors.fotos?.[index]?.url && <p className="error-message">{errors.fotos[index]?.url?.message}</p>}
                   </div>
                )) : <p className="text-xs text-gray-400 italic mt-1">No hay fotos añadidas.</p>}
                <button type="button" onClick={() => appendPhoto({ url: '' })} className="btn-primary-sm" > <PlusIcon/> Añadir URL </button>
                {(errors.fotos && !Array.isArray(errors.fotos)) && <p className="error-message">{errors.fotos.message}</p>}
            </div>
            {/* Video URL */}
            <div>
               <label htmlFor="video" className="input-label">Video (URL Opcional)</label>
               <input id="video" type="url" {...register('video')} className={cn('input-field', errors.video && 'input-error')} placeholder="https://youtube.com/..."/>
               {errors.video && <p className="error-message">{errors.video.message}</p>}
            </div>
         </div>
       </div>

      {/* --- Grupo: Opciones de Variante --- */}
      <div className="form-section">
         <h3 className="form-section-title">Opciones de Variante</h3>
         <p className="text-sm text-gray-500 mb-4">Define los atributos que generan SKUs diferentes (ej: Talla, Color). Los valores van separados por comas.</p>
         <div className="space-y-4">
           {optionFields.length > 0 ? optionFields.map((field, index) => (
             <div key={field.id} className="flex items-start gap-3 p-3 border rounded-md bg-gray-50/50 flex-col sm:flex-row">
                <div className="flex-1 w-full sm:w-auto">
                  <label htmlFor={`opt_${index}_n`} className="block text-xs font-medium text-gray-500 mb-1"> Nombre Opción * <span className="text-gray-400">(ej: Talla)</span> </label>
                  <input id={`opt_${index}_n`} placeholder="Ej: Talla" {...register(`opciones.${index}.nombre`)} className={cn('input-field-sm', errors.opciones?.[index]?.nombre && 'input-error')} />
                  {errors.opciones?.[index]?.nombre && <p className="error-message text-xs">{errors.opciones[index]?.nombre?.message}</p>}
                </div>
                <div className="flex-1 w-full sm:w-auto">
                   <label htmlFor={`opt_${index}_v`} className="block text-xs font-medium text-gray-500 mb-1"> Valores * <span className="text-gray-400">(ej: S, M, L)</span> </label>
                  <input id={`opt_${index}_v`} placeholder="Ej: S, M, L, XL" {...register(`opciones.${index}.valores`)} className={cn('input-field-sm', errors.opciones?.[index]?.valores && 'input-error')} />
                   {errors.opciones?.[index]?.valores && <p className="error-message text-xs">{errors.opciones[index]?.valores?.message}</p>}
                </div>
                <button type="button" onClick={() => removeOption(index)} className="btn-danger-sm mt-5 sm:mt-6" title="Eliminar opción" > <TrashIcon/> </button>
             </div>
           )) : <p className="text-xs text-gray-400 italic mt-1">No hay opciones de variante definidas.</p>}
         </div>
         <button type="button" onClick={() => appendOption({ nombre: '', valores: '' })} className="btn-primary-sm mt-3" > <PlusIcon/> Añadir Opción </button>
         {(errors.opciones && !Array.isArray(errors.opciones)) && <p className="error-message">{errors.opciones.message}</p>}
      </div>

       {/* --- Nota SKU/Stock --- */}
       <div className="pt-4"> {/* Sin borde superior */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
             <div className="flex">
                <div className="flex-shrink-0">
                   <InfoIcon/> {/* Icono de Información */}
                </div>
                <div className="ml-3">
                   <p className="text-sm text-yellow-700">
                      Recuerda: El <strong className="font-semibold">SKU</strong> y el <strong className="font-semibold">Stock por Talla/Color</strong> se gestionan en la sección 'Variantes (SKUs)' <Link href={isEditMode ? `/productos/${initialData?.id}#variantes` : '#'} className={cn("font-semibold underline hover:text-yellow-800", !isEditMode && "pointer-events-none text-yellow-500")} aria-disabled={!isEditMode}>después</Link> de guardar este producto.
                   </p>
                </div>
             </div>
          </div>
       </div>

      {/* --- Botones de Acción --- */}
      <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-gray-200">
         <button type="button" onClick={() => router.back()} disabled={isLoadingMutation} className="btn-cancel" >Cancelar</button>
         <button type="submit" disabled={isLoadingMutation || isSubmitting} className="btn-primary" >
            {isLoadingMutation ? <SpinnerIcon/> : null}
            <span>{isLoadingMutation ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Producto')}</span>
         </button>
      </div>

       {/* --- Modal Crear Categoría --- */}
       {isCategoryModalOpen && (
         <CategoryForm categories={categories} onSubmit={handleCreateCategorySubmit} onCancel={() => setIsCategoryModalOpen(false)} isLoading={createCategoryMutation.isPending} />
       )}
    </form>
  );
}

// --- Iconos SVG ---
const PlusIcon = () => (<svg className="icon-sm" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const TrashIcon = () => (<svg className="icon-md" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>);
const SpinnerIcon = () => (<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const InfoIcon = () => (<svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>);