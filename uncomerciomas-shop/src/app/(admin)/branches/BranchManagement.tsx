// src/components/admin/branches/BranchManagement.tsx
"use client";

import { useState } from 'react';
import { useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch } from '@/hooks/useBranches';
import type { Branch } from '@/types/branch.types';
import type { BranchPayload } from '@/services/branch.service';
// Importaremos BranchForm más adelante
import { BranchForm } from './BranchForm';

// Icono simple para la matriz (puedes usar algo mejor)
const StarIcon = () => <span title="Sucursal Matriz" className="text-yellow-500">⭐</span>;

export function BranchManagement() {
  const { data: branches = [], isLoading, error } = useBranches();
  const createBranchMutation = useCreateBranch();
  const updateBranchMutation = useUpdateBranch();
  const deleteBranchMutation = useDeleteBranch();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // --- Manejo de Carga y Errores ---
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded shadow animate-pulse">
        <p>Cargando sucursales...</p>
         <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 mt-4"></div>
         <div className="space-y-3">
           <div className="h-6 bg-gray-200 rounded w-full"></div>
           <div className="h-6 bg-gray-200 rounded w-5/6"></div>
         </div>
      </div>
    );
  }
  if (error) return <p className="text-red-500">Error al cargar sucursales: {error.message}</p>;

  // --- Funciones Handler ---
  const handleOpenCreateForm = () => {
    setEditingBranch(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (branch: Branch) => {
    setEditingBranch(branch);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBranch(null);
  };

  const handleCreateSubmit = (formData: BranchPayload) => {
    createBranchMutation.mutate(formData, {
      onSuccess: handleCloseForm,
      onError: (err: any) => alert(`Error al crear: ${err.response?.data?.message || err.message}`)
    });
  };

  const handleUpdateSubmit = (formData: BranchPayload) => {
    if (!editingBranch) return;
    updateBranchMutation.mutate({ id: editingBranch.id, payload: formData }, {
      onSuccess: handleCloseForm,
      onError: (err: any) => alert(`Error al actualizar: ${err.response?.data?.message || err.message}`)
    });
  };

  const handleDelete = (id: string, name: string) => {
     if (window.confirm(`¿Estás seguro de que quieres eliminar la sucursal "${name}"?`)) {
        deleteBranchMutation.mutate(id, {
           onError: (err: any) => alert(`Error al eliminar: ${err.response?.data?.message || err.message}`)
        });
     }
  };

  // Determina si alguna mutación está en curso
  const isMutating = createBranchMutation.isPending || updateBranchMutation.isPending || deleteBranchMutation.isPending;

  return (
    <div>
      {/* Botón Nueva Sucursal */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleOpenCreateForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isMutating}
        >
          + Nueva Sucursal
        </button>
      </div>

      {/* Tabla de Sucursales */}
      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
         <h2 className="text-xl font-semibold mb-4 text-gray-700">Lista de Sucursales</h2>
         {branches.length > 0 ? (
           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
               <tr>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                 <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Matriz</th>
                 <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {branches.map((branch) => (
                   <tr key={branch.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.nombre}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.direccion || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.telefono || '-'}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                       {branch.es_matriz ? <StarIcon /> : ''}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                       <button
                          onClick={() => handleOpenEditForm(branch)}
                          className="text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none"
                          title="Editar"
                          disabled={isMutating}
                       >
                         Editar
                       </button>
                       <button
                          onClick={() => handleDelete(branch.id, branch.nombre)}
                          className="text-red-600 hover:text-red-900 hover:underline focus:outline-none"
                          title="Eliminar"
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
           <p className="text-gray-500 italic text-center py-4">No hay sucursales creadas todavía.</p>
         )}
      </div>

      {/* --- Modal del Formulario (se renderiza condicionalmente) --- */}
       {isFormOpen && (
        <BranchForm
          initialData={editingBranch}
          onSubmit={editingBranch ? handleUpdateSubmit : handleCreateSubmit}
          onCancel={handleCloseForm}
          isLoading={isMutating}
        />
      )} 
       <p className="mt-4 text-sm text-gray-500">(Formulario BranchForm irá aquí)</p>
    </div>
  );
}