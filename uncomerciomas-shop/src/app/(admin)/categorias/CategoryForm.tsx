// src/components/admin/categories/CategoryForm.tsx
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Category } from '@/types/category.types';
import type { CategoryPayload } from '@/services/category.service';
import { useEffect } from 'react';

// Esquema de validación con Zod
const categorySchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres')
         .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido (solo letras minúsculas, números y guiones)'),
  id_padre: z.string().uuid('Debe ser un UUID válido').nullable().optional(), // Acepta UUID, null o undefined
});

// Tipos para las props del formulario
interface CategoryFormProps {
  initialData?: Category | null; // Datos para editar (opcional)
  categories: Category[]; // Lista de Colecciones para el selector de padre
  onSubmit: (data: CategoryPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CategoryForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
}: CategoryFormProps) {

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryPayload>({
    resolver: zodResolver(categorySchema),
    defaultValues: { // Establece valores por defecto o los de edición
      nombre: initialData?.nombre || '',
      slug: initialData?.slug || '',
      id_padre: initialData?.id_padre || null, // Asegura que sea null si no hay padre
    },
  });

  // Si initialData cambia (ej. al abrir el modal para editar), resetea el form
  useEffect(() => {
    reset({
      nombre: initialData?.nombre || '',
      slug: initialData?.slug || '',
      id_padre: initialData?.id_padre || null,
    });
  }, [initialData, reset]);

  // Función que se llama al enviar el formulario válido
  const handleFormSubmit = (data: CategoryPayload) => {
    // Aseguramos que id_padre sea null si está vacío, antes de enviarlo
    const payload = {
      ...data,
      id_padre: data.id_padre === '' ? null : data.id_padre,
    };
    onSubmit(payload);
  };

  return (
    // Usaremos un modal simple (puedes usar Shadcn UI o similar después)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {initialData ? 'Editar Coleccion' : 'Nueva Coleccion'}
        </h2>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Campo Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              id="nombre"
              {...register('nombre')}
              className={`w-full border p-2 rounded ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
          </div>

          {/* Campo Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
            <input
              id="slug"
              {...register('slug')}
              className={`w-full border p-2 rounded ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
          </div>

          {/* Selector Coleccion Padre */}
          <div>
            <label htmlFor="id_padre" className="block text-sm font-medium text-gray-700 mb-1">Coleccion Padre (Opcional)</label>
            <select
              id="id_padre"
              {...register('id_padre')}
              className={`w-full border p-2 rounded ${errors.id_padre ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">-- Ninguna --</option>
              {/* Filtramos la Coleccion actual si estamos editando */}
              {categories.filter(cat => cat.id !== initialData?.id).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
             {errors.id_padre && <p className="text-red-500 text-xs mt-1">{errors.id_padre.message}</p>}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (initialData ? 'Guardando...' : 'Creando...') : (initialData ? 'Guardar Cambios' : 'Crear Coleccion')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}