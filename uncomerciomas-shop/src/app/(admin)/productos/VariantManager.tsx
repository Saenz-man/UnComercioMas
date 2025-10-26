// src/components/admin/products/VariantManager.tsx
"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation'; // Para obtener productId
import {
  useProductVariants,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant
} from '@/hooks/useProductVariants'; // Hooks que acabamos de crear
import type { ProductVariant } from '@/types/product-variant.types';
import type { VariantPayload } from '@/services/product.service';
import { VariantFormModal } from './VariantFormModal'; // Formulario/Modal que crearemos

// Interfaz para las props, solo necesitamos el ID del producto padre
interface VariantManagerProps {
  productId: string;
}

export function VariantManager({ productId }: VariantManagerProps) {
  // Hooks de React Query para variantes
  const { data: variants = [], isLoading, error } = useProductVariants(productId);
  const createVariantMutation = useCreateVariant(productId);
  const updateVariantMutation = useUpdateVariant(productId);
  const deleteVariantMutation = useDeleteVariant(productId);

  // Estados para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

  // --- Manejo de Carga y Errores ---
  if (isLoading) {
    return (
      <div className="form-section animate-pulse">
        <h3 className="text-lg font-medium text-gray-900 mb-4 h-6 bg-gray-200 rounded w-1/3"></h3>
        <p className="text-gray-500">Cargando variantes...</p>
        <div className="h-20 bg-gray-200 rounded mt-4"></div>
      </div>
    );
  }
  if (error) return <p className="text-red-500">Error al cargar variantes: {error.message}</p>;

  // --- Funciones Handler ---
  const handleOpenCreateModal = () => {
    setEditingVariant(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVariant(null);
  };

  const handleCreateSubmit = (formData: VariantPayload) => {
    createVariantMutation.mutate(formData, {
      onSuccess: handleCloseModal,
      onError: (err: any) =>
        alert(`Error al crear variante: ${err.response?.data?.message || err.message}`),
    });
  };

  const handleUpdateSubmit = (formData: Partial<VariantPayload>) => {
    if (!editingVariant) return;
    updateVariantMutation.mutate(
      { variantId: editingVariant.id, payload: formData },
      {
        onSuccess: handleCloseModal,
        onError: (err: any) =>
          alert(`Error al actualizar variante: ${err.response?.data?.message || err.message}`),
      }
    );
  };

  const handleDelete = (variantId: string, sku: string) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar el SKU "${sku}"? Esta acción no se puede deshacer.`
      )
    ) {
      deleteVariantMutation.mutate(variantId, {
        onError: (err: any) =>
          alert(`Error al eliminar variante: ${err.response?.data?.message || err.message}`),
        // onSuccess no necesita alerta, la tabla se recarga sola
      });
    }
  };

  // ✅ Wrapper que adapta la firma esperada por VariantFormModal
  const handleSubmitFromModal = (data: VariantPayload | Partial<VariantPayload>) => {
    if (editingVariant) {
      handleUpdateSubmit(data as Partial<VariantPayload>);
    } else {
      handleCreateSubmit(data as VariantPayload);
    }
  };

  const isMutating =
    createVariantMutation.isPending ||
    updateVariantMutation.isPending ||
    deleteVariantMutation.isPending;

  return (
    <div className="form-section">
      {/* Encabezado y Botón Añadir */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Variantes (SKUs)</h3>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="bg-green-600 text-white px-3 py-1.5 rounded-md shadow-sm text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          disabled={isMutating}
        >
          + Añadir SKU
        </button>
      </div>

      {/* --- Tabla de Variantes --- */}
      <div className="overflow-x-auto border rounded-lg">
        {variants.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  SKU
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Atributos
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Stock
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variants.map((variant) => (
                <tr key={variant.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                    {variant.sku}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {Object.entries(variant.atributos)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(', ')}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-center font-semibold">
                    {variant.stock}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleOpenEditModal(variant)}
                      className="text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none text-xs"
                      title="Editar Stock/SKU"
                      disabled={isMutating}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(variant.id, variant.sku)}
                      className="text-red-600 hover:text-red-900 hover:underline focus:outline-none text-xs"
                      title="Eliminar SKU"
                      disabled={isMutating}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 italic text-center py-6">
            No hay variantes (SKUs) creadas para este producto.
          </p>
        )}
      </div>

      {/* --- Modal del Formulario --- */}
      {isModalOpen && (
        <VariantFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitFromModal}
          initialData={editingVariant}
          isLoading={isMutating}
        />
      )}
    </div>
  );
}
