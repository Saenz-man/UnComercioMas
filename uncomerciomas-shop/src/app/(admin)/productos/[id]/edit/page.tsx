import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import { ProductService } from '@/services/product.service';
import { CategoryService } from '@/services/category.service';
import { ModelService } from '@/services/model.service';
import { ProductForm } from '../../components/ProductForm'; // Ajusta la ruta a tu carpeta 'components'
import type { Product } from '@/types/product.types';

interface EditProductPageProps {
  params: {
    id: string; // El [id] de la URL
  };
}

// Esta es una página de Servidor (Async Component)
export default async function EditProductPage({ params }: EditProductPageProps) {
  
  const queryClient = new QueryClient();
  const productId = params.id;

  if (!productId) {
     return <div className="container mx-auto p-8"><p>ID de producto no válido.</p></div>;
  }

  // Pre-cargamos todos los datos necesarios en paralelo
  try {
    await Promise.all([
      // Producto específico
      queryClient.prefetchQuery({
        queryKey: ['product', productId],
        queryFn: () => ProductService.getById(productId), // Asumo que este servicio existe
      }),
      // Categorías (para el select)
      queryClient.prefetchQuery({
        queryKey: ['categories'],
        queryFn: CategoryService.getAll,
      }),
      // Modelos (para el select)
      queryClient.prefetchQuery({
        queryKey: ['models'],
        queryFn: ModelService.getAll,
      })
    ]);
  } catch (error) {
    console.error("Error fetching product data:", error);
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-destructive">Error</h1>
        <p>No se pudo cargar el producto. Es posible que el ID no exista.</p>
      </div>
    );
  }

  // Obtenemos el producto de la caché para pasarlo como prop
  const product = queryClient.getQueryData<Product>(['product', productId]);

  if (!product) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-destructive">Error</h1>
        <p>Producto con ID {productId} no encontrado.</p>
      </div>
    );
  }

  // Renderizamos
  return (
    // HydrationBoundary pasa los datos del servidor al cliente (ProductForm)
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto p-4 md:p-8">
        {/* Renderizamos el MISMO formulario, pero esta vez
          le pasamos 'initialData'. Esto lo pone
          automáticamente en modo "Editar".
        */}
        <ProductForm initialData={product} />
      </div>
    </HydrationBoundary>
  );
}