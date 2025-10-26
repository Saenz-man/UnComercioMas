// src/components/admin/products/VariantFormModal.tsx
"use client";

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ProductVariant } from '@/types/product-variant.types';
import type { VariantPayload } from '@/services/product.service';
import { useEffect } from 'react';

// --- Schema de Validación (SIMPLIFICADO Y CORREGIDO) ---
const variantSchema = z.object({
  sku: z.string().min(1, 'SKU es requerido'),
  // Stock: Validar como STRING y convertir en onSubmit
  stock: z.string()
    .min(1, 'Stock es requerido')
    .regex(/^\d+$/, { message: 'Debe ser un número entero positivo' })
    .refine((val) => parseInt(val, 10) >= 0, { message: 'No puede ser negativo' }), // Permitir 0

  // Atributos: Record<string, string> no vacío
  atributos: z
    // Define key y value types SIN parámetros de error aquí
    .record(z.string(), z.string().min(1, "El valor no puede estar vacío")) 
    // Mensaje general si el objeto no cumple el refine
    .refine(obj => obj && Object.keys(obj).length > 0 && Object.values(obj).every(v => v && v.length > 0), {
      message: "Define al menos un atributo (ej: talla, color) con valor válido",
    }),

  foto_variante: z.string().url({ message: 'URL inválida' }).or(z.literal('')).optional(),
});
// --- FIN Schema ---


// Tipo inferido (stock será STRING)
type VariantFormData = z.infer<typeof variantSchema>;

// Props del Modal
interface VariantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VariantPayload | Partial<VariantPayload>) => void;
  initialData?: ProductVariant | null;
  isLoading?: boolean;
}

// --- Componente ---
export function VariantFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: VariantFormModalProps) {
  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema), // <-- Ya no debería dar error
    // Stock se maneja como string
    defaultValues: {
      sku: initialData?.sku || '',
      stock: initialData?.stock != null ? String(initialData.stock) : '', // <-- String
      atributos: initialData?.atributos || {},
      foto_variante: initialData?.foto_variante || '',
    },
  });

  // Resetear (stock como string)
  useEffect(() => {
    if (isOpen) {
      reset({
        sku: initialData?.sku || '',
        stock: initialData?.stock != null ? String(initialData.stock) : '', // <-- String
        atributos: initialData?.atributos || {},
        foto_variante: initialData?.foto_variante || '',
      });
    }
  }, [isOpen, initialData, reset]);

  // Handler del submit (CONVERSIÓN MANUAL)
  const handleFormSubmit: SubmitHandler<VariantFormData> = (data) => { // <-- Ya no debería dar error
    console.log("Variant Form data (strings):", data);
    try {
      // Convertir stock a número
      const stockNum = parseInt(data.stock, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        throw new Error('Stock inválido después de validación.');
      }

      const payload: VariantPayload | Partial<VariantPayload> = {
          sku: data.sku,
          stock: stockNum, // <-- Número convertido
          atributos: data.atributos,
          foto_variante: data.foto_variante || undefined,
      };
      console.log("Variant Payload to send:", payload);
      onSubmit(payload); // Llama a la prop onSubmit

    } catch (conversionError: any) {
        console.error("Error convirtiendo stock:", conversionError);
        alert(`Error en el stock: ${conversionError.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg animate-fade-in-up relative">
         {/* ... (Botón cerrar, título) ... */}

         <style jsx global>{` /* ... estilos ... */ `}</style>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* ... (Campo SKU) ... */}

          {/* Campo Stock (Input type="number", Zod valida string) */}
          <div>
            <label htmlFor="stock" className="input-label">Stock *</label>
            <input
              id="stock"
              type="number" // Mantenemos number por conveniencia
              step="1"
              min="0"
              {...register('stock')} // Registra string, Zod valida
              className={`input-field ${errors.stock ? 'input-error' : ''}`}
              placeholder="0"
            />
            {/* Mensaje de error de Zod */}
            {errors.stock && <p className="error-message">{errors.stock.message}</p>}
          </div>

          {/* --- Sección Atributos --- */}
          <div className="border-t pt-4">
             <h4 className="text-sm font-medium text-gray-600 mb-2">Atributos *</h4>
             <div className="grid grid-cols-2 gap-4">
                 {/* ... input talla ... */}
                 {/* ... input color ... */}
             </div>
             {/* --- CORRECCIÓN ERROR GENERAL ATRIBUTOS --- */}
             {/* Mostrar el error general del objeto 'atributos' (del refine) */}
             {errors.atributos && typeof errors.atributos.message === 'string' && (
                <p className="error-message">{errors.atributos.message}</p>
             )}
             {/* --- FIN CORRECCIÓN --- */}
             <p className="text-xs text-gray-400 mt-1">Define los atributos.</p>
          </div>
          {/* --- Fin Atributos --- */}

          {/* ... (Campo Foto Variante) ... */}
          {/* ... (Botones) ... */}
        </form>
      </div>
    </div>
  );
}

// ... (Estilos)