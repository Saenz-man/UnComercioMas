"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Branch } from '@/types/branch.types';
import type { BranchPayload } from '@/services/branch.service';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button'; // <-- Importar Button si no está ya
import { Input } from '@/components/ui/input';   // <-- Importar Input si no está ya
import { Label } from '@/components/ui/label';   // <-- Importar Label si no está ya
import { Checkbox } from "@/components/ui/checkbox"; // <-- Usar Checkbox de Shadcn si lo tienes

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

  const { register, handleSubmit, reset, watch, formState: { errors }, control } = useForm<BranchPayload>({ // <-- Añadir control
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
    // --- DIV PRINCIPAL CORREGIDO ---
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }} // Fondo translúcido explícito
    >
      {/* Contenido del modal (el div blanco interno) */}
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg animate-fade-in-up"> {/* Efecto de entrada simple */}
        <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">
          {initialData ? 'Editar Sucursal' : 'Nueva Sucursal'}
        </h2>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Campo Nombre */}
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              {...register('nombre')}
              className={errors.nombre ? 'border-red-500' : ''} // Usar clases de Shadcn para errores si prefieres
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
          </div>

          {/* Campo Dirección */}
          <div>
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              {...register('direccion')}
              className={errors.direccion ? 'border-red-500' : ''}
            />
            {errors.direccion && <p className="text-red-500 text-xs mt-1">{errors.direccion.message}</p>}
          </div>

          {/* Campo Teléfono */}
          <div>
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              {...register('telefono')}
              className={errors.telefono ? 'border-red-500' : ''}
            />
            {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
          </div>

           {/* Campo Tipo (Opcional) */}
          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Input
              id="tipo"
              {...register('tipo')}
              // defaultValue="sucursal" // No es necesario con defaultValues de RHF
              className={errors.tipo ? 'border-red-500' : ''}
            />
             {errors.tipo && <p className="text-red-500 text-xs mt-1">{errors.tipo.message}</p>}
          </div>

          {/* Checkbox Es Matriz (Usando Shadcn si está disponible) */}
          <div className="flex items-center space-x-2">
             {/* Si NO usas Shadcn Checkbox, usa el input normal:
            <input
              id="es_matriz"
              type="checkbox"
              {...register('es_matriz')}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
             */}
             {/* Si SÍ usas Shadcn Checkbox: */}
             <Checkbox
              id="es_matriz"
              {...register('es_matriz')}
              // Necesitas 'control' de useForm para Checkbox de Shadcn
              // checked={watch('es_matriz')} // Podrías necesitar watch si usas Checkbox controlado
              // onCheckedChange={(checked) => setValue('es_matriz', !!checked)} // O setValue
            />
            <Label htmlFor="es_matriz" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Marcar como Sucursal Matriz
            </Label>
          </div>
          {errors.es_matriz && <p className="text-red-500 text-xs mt-1">{errors.es_matriz.message}</p>}


          {/* Botones (Usando Shadcn Button) */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button
              type="button"
              variant="outline" // Variante outline para Cancelar
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading && ( /* Spinner simple (podrías usar Loader2 de lucide) */
                 <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              )}
              {isLoading ? (initialData ? 'Guardando...' : 'Creando...') : (initialData ? 'Guardar Cambios' : 'Crear Sucursal')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
