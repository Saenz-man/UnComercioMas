// src/components/admin/branches/BranchForm.tsx
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Branch } from '@/types/branch.types';
import type { BranchPayload } from '@/services/branch.service';
import { useEffect } from 'react';

// Esquema de validación con Zod (coincide con CreateBranchDto)
const branchSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  es_matriz: z.boolean().optional().default(false),
  tipo: z.string().optional().default('sucursal'),
});

// Tipos para las props del formulario
interface BranchFormProps {
  initialData?: Branch | null; // Datos para editar (opcional)
  onSubmit: (data: BranchPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BranchForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: BranchFormProps) {

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<BranchPayload>({
    resolver: zodResolver(branchSchema),
    defaultValues: { // Establece valores por defecto o los de edición
      nombre: initialData?.nombre || '',
      direccion: initialData?.direccion || '',
      telefono: initialData?.telefono || '',
      es_matriz: initialData?.es_matriz || false,
      tipo: initialData?.tipo || 'sucursal',
    },
  });

  // Si initialData cambia, resetea el form
  useEffect(() => {
    reset({
      nombre: initialData?.nombre || '',
      direccion: initialData?.direccion || '',
      telefono: initialData?.telefono || '',
      es_matriz: initialData?.es_matriz || false,
      tipo: initialData?.tipo || 'sucursal',
    });
  }, [initialData, reset]);

  // Función que se llama al enviar el formulario válido
  const handleFormSubmit = (data: BranchPayload) => {
    // Limpia campos opcionales si están vacíos antes de enviar
    const payload = {
      ...data,
      direccion: data.direccion || undefined, // Envía undefined si está vacío
      telefono: data.telefono || undefined,
      tipo: data.tipo || 'sucursal',
    };
    onSubmit(payload);
  };

  return (
    // Modal simple
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg animate-fade-in-up"> {/* Efecto de entrada simple */}
        <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">
          {initialData ? 'Editar Sucursal' : 'Nueva Sucursal'}
        </h2>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Campo Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              id="nombre"
              {...register('nombre')}
              className={`w-full border p-2 rounded-md shadow-sm ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
          </div>

          {/* Campo Dirección */}
          <div>
            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              id="direccion"
              {...register('direccion')}
              className={`w-full border p-2 rounded-md shadow-sm ${errors.direccion ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.direccion && <p className="text-red-500 text-xs mt-1">{errors.direccion.message}</p>}
          </div>

          {/* Campo Teléfono */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              id="telefono"
              {...register('telefono')}
              className={`w-full border p-2 rounded-md shadow-sm ${errors.telefono ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
          </div>

           {/* Campo Tipo (Opcional) */}
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <input
              id="tipo"
              {...register('tipo')}
               defaultValue="sucursal" // Valor por defecto
              className={`w-full border p-2 rounded-md shadow-sm ${errors.tipo ? 'border-red-500' : 'border-gray-300'}`}
            />
             {errors.tipo && <p className="text-red-500 text-xs mt-1">{errors.tipo.message}</p>}
          </div>

          {/* Checkbox Es Matriz */}
          <div className="flex items-center">
            <input
              id="es_matriz"
              type="checkbox"
              {...register('es_matriz')}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="es_matriz" className="ml-2 block text-sm text-gray-900">
              Marcar como Sucursal Matriz
            </label>
          </div>
          {errors.es_matriz && <p className="text-red-500 text-xs mt-1">{errors.es_matriz.message}</p>}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && ( /* Spinner simple */
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              )}
              {isLoading ? (initialData ? 'Guardando...' : 'Creando...') : (initialData ? 'Guardar Cambios' : 'Crear Sucursal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}