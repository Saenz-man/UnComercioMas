import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import { ProductCreateForm } from './ProductCreateForm';
// El servicio de atributos está bien
import { attributeService } from '@/services/attribute.service';
// --- ¡CAMBIO AQUÍ! ---
// Importa 'CategoryService' (con C mayúscula) en lugar de 'categoryService'
import { CategoryService } from '@/services/category.service'; 
// --- FIN DEL CAMBIO ---

export default async function CreateProductPage() {
  const queryClient = new QueryClient();

  // Pre-cargamos categorías y atributos en el servidor
  await queryClient.prefetchQuery({
    queryKey: ['categories'],
    // --- ¡CAMBIO AQUÍ! ---
    // Usa 'CategoryService.getAll' (con C mayúscula)
    queryFn: CategoryService.getAll, 
    // --- FIN DEL CAMBIO ---
  });
  
  await queryClient.prefetchQuery({
    queryKey: ['attributes'],
    queryFn: attributeService.getAttributes,
  });

  return (
    // HydrationBoundary pasa los datos pre-cargados al cliente
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Crear Nuevo Producto</h1>
        <ProductCreateForm />
      </div>
    </HydrationBoundary>
  );
}

