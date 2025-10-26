// src/app/(admin)/dashboard/page.tsx
"use client"; // Marcamos como Client Component por si necesitas interactividad después

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

// --- 1. IMPORTAR EL NUEVO COMPONENTE ---
import { RecentOrdersTable } from './RecentOrdersTable'; 

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Verificación simple de autenticación (puedes mejorarla con un context/hook)
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      console.log("[DashboardPage] No hay token, redirigiendo a login...");
      router.push('/login'); // Ajusta la ruta a tu página de login si es diferente
    } else {
      // Aquí podrías validar el token contra la API o decodificarlo para verificar el rol
      console.log("[DashboardPage] Token encontrado, mostrando dashboard.");
      setLoading(false);
    }
  }, [router]);

  // Muestra un mensaje mientras verifica el token
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Verificando sesión...</p>
      </div>
    );
  }

  // Contenido del Dashboard una vez verificado
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8 flex justify-between items-center"> {/* Opcional: Flex para alinear botón */}
        <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
        {/* Aquí podrías añadir un botón de Logout */}
        {/* <button onClick={handleLogout} className="...">Logout</button> */}
      </header>

      <main>
        {/* --- TARJETAS DE MÉTRICAS (Placeholder) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"> {/* Añadido mb-8 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Ventas Recientes</h2>
            <p className="text-gray-600">Contenido sobre ventas...</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Inventario Bajo</h2>
            <p className="text-gray-600">Alertas de inventario...</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Actividad de Usuarios</h2>
            <p className="text-gray-600">Información sobre usuarios...</p>
          </div>
        </div>

        {/* --- 2. INTEGRAR LA TABLA DE ÓRDENES RECIENTES --- */}
        <div className="mb-8"> {/* Separación opcional */}
          <RecentOrdersTable /> 
        </div>
        {/* --- FIN DE LA INTEGRACIÓN --- */}


        {/* --- GRÁFICO (Placeholder) --- */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Gráfico de Ejemplo</h2>
          <div className="h-64 bg-gray-200 rounded flex items-center justify-center">
            <p className="text-gray-500">[Aquí iría un gráfico]</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// Opcional: Función de ejemplo para Logout
// const handleLogout = () => {
//   Cookies.remove('token');
//   localStorage.removeItem('token');
//   router.push('/login');
// };