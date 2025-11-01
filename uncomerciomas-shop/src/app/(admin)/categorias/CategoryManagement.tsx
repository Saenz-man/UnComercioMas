// src/components/admin/categories/CategoryManagement.tsx
"use client";

import { useCategories, useCreateCategory } from '@/hooks/useCategories';
import { useState } from 'react';
import type { Category } from '@/types/category.types';
import type { CategoryPayload } from '@/services/category.service';
import { CategoryForm } from './CategoryForm'; // Asume que este archivo está en la misma carpeta

// (Añadir imports para useUpdateCategory, useDeleteCategory cuando los crees)

export function CategoryManagement() {
  // Hook para obtener Colecciones (valor por defecto [])
  const { data: categories = [], isLoading, error } = useCategories();
  // Hook para crear Coleccion
  const createCategoryMutation = useCreateCategory();
  // (Hooks para editar y eliminar irían aquí)
  // const updateCategoryMutation = useUpdateCategory();
  // const deleteCategoryMutation = useDeleteCategory();

  // Estados para controlar el modal/formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // --- Manejo de Carga y Errores ---
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded shadow animate-pulse">
        <p>Cargando Colecciones...</p>
        {/* Puedes añadir un skeleton loader más visual aquí */}
         <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 mt-4"></div>
         <div className="space-y-3">
           <div className="h-6 bg-gray-200 rounded w-full"></div>
           <div className="h-6 bg-gray-200 rounded w-5/6"></div>
           <div className="h-6 bg-gray-200 rounded w-full"></div>
         </div>
      </div>
    );
  }
  if (error) return <p className="text-red-500">Error al cargar Colecciones: {error.message}</p>;

  // --- Funciones Handler ---
  const handleOpenCreateForm = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleCreateSubmit = (formData: CategoryPayload) => {
    console.log("Submit Crear:", formData);
    createCategoryMutation.mutate(formData, {
      onSuccess: () => {
        handleCloseForm();
        // Opcional: Mostrar notificación de éxito
        alert("Coleccion creada con éxito!");
      },
      onError: (err: any) => {
        // Opcional: Mostrar notificación de error
         alert(`Error al crear: ${err.response?.data?.message || err.message}`);
      }
    });
  };

  const handleUpdateSubmit = (formData: CategoryPayload) => {
    if (!editingCategory) return;
    console.log("Submit Editar:", editingCategory.id, formData);
    alert('Funcionalidad de editar pendiente. Conectar con useUpdateCategory.'); // Placeholder
    // Aquí llamarías a la mutación de actualización
    // updateCategoryMutation.mutate({ id: editingCategory.id, ...formData }, {
    //   onSuccess: handleCloseForm,
    //   onError: (err) => { alert(`Error al actualizar: ${...}`); }
    // });
    handleCloseForm();
  };

  const handleDelete = (id: string, name: string) => {
     if (window.confirm(`¿Estás seguro de que quieres eliminar la Coleccion "${name}"?`)) {
        console.log("Eliminar Coleccion:", id);
        alert('Funcionalidad de eliminar pendiente. Conectar con useDeleteCategory.'); // Placeholder
        // Aquí llamarías a la mutación de eliminación
        // deleteCategoryMutation.mutate(id, {
        //    onSuccess: () => { alert('Coleccion eliminada'); },
        //    onError: (err) => { alert(`Error al eliminar: ${...}`); }
        // });
     }
  };

  return (
    <div>
      {/* Botón para abrir el modal de creación */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleOpenCreateForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={createCategoryMutation.isPending /* || other mutations */}
        >
          + Nueva Coleccion
        </button>
      </div>

      {/* --- Tabla de Colecciones --- */}
      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
         <h2 className="text-xl font-semibold mb-4 text-gray-700">Lista de Colecciones</h2>
         {categories.length > 0 ? (
           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
               <tr>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coleccion Padre</th>
                 <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {categories.map((cat) => {
                 // Busca el nombre de la Coleccion padre
                 const parentCategory = cat.id_padre ? categories.find(p => p.id === cat.id_padre) : null;
                 return (
                   <tr key={cat.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.nombre}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{cat.slug}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {parentCategory ? parentCategory.nombre : <span className="text-gray-400">- Ninguna -</span>}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                       <button
                          onClick={() => handleOpenEditForm(cat)}
                          className="text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none"
                          title="Editar"
                       >
                         Editar
                       </button>
                       <button
                          onClick={() => handleDelete(cat.id, cat.nombre)}
                          className="text-red-600 hover:text-red-900 hover:underline focus:outline-none"
                          title="Eliminar"
                          // disabled={deleteCategoryMutation.isPending} // Deshabilitar mientras elimina
                       >
                         Eliminar
                       </button>
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
         ) : (
           <p className="text-gray-500 italic text-center py-4">No hay Colecciones creadas todavía.</p>
         )}
      </div>
      {/* --- Fin de la Tabla --- */}


      {/* --- Modal del Formulario (se renderiza condicionalmente) --- */}
      {isFormOpen && (
        <CategoryForm
          initialData={editingCategory}
          categories={categories}
          onSubmit={editingCategory ? handleUpdateSubmit : handleCreateSubmit}
          onCancel={handleCloseForm}
          isLoading={createCategoryMutation.isPending /* || updateMutation.isPending || deleteMutation.isPending */}
        />
      )}
    </div>
  );
}