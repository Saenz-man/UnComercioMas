import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import { ProductsTable } from './ProductsTable'; // El componente que crearemos a continuación
import { ProductService } from '@/services/product.service';

export default async function ProductsListPage() {
  const queryClient = new QueryClient();

  // Pre-cargamos la lista de productos en el servidor
  await queryClient.prefetchQuery({
    queryKey: ['products'],
  });

  return (
    // HydrationBoundary pasa los datos pre-cargados al cliente
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Productos</h1>
          {/* Podrías poner aquí un Link/botón para ir a /productos/create */}
        </div>
        <ProductsTable />
      </div>
    </HydrationBoundary>
  );
}
