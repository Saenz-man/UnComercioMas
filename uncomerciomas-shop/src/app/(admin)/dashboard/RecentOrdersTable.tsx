// src/components/dashboard/RecentOrdersTable.tsx
"use client"; // Necesario para usar hooks

import { useRecentOrders } from '@/hooks/useRecentOrders';
import Link from 'next/link'; // Para enlazar al detalle de la orden

export function RecentOrdersTable() {
  // Llama al hook para obtener los datos
  const { data: orders, isLoading, error, isFetching } = useRecentOrders(5); // Pide las últimas 5

  // --- Manejo de Estados de Carga y Error ---
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 h-6 bg-gray-200 rounded w-1/3"></h2>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-red-200">
        <h2 className="text-xl font-semibold mb-4 text-red-700">Error al Cargar Órdenes</h2>
        <p className="text-red-600">{error.message}</p>
        <p className="text-sm text-gray-500 mt-2">Intenta recargar la página o revisa la conexión con la API.</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Órdenes Recientes</h2>
        <p className="text-gray-500">No se encontraron órdenes recientes.</p>
      </div>
    );
  }

  // --- Renderizado de la Tabla ---
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md transition-opacity duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Órdenes Recientes</h2>
      <div className="overflow-x-auto"> {/* Para tablas en móviles */}
        <table className="min-w-full text-left text-sm text-gray-700">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-2 font-medium">ID Orden</th>
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
              <th className="px-4 py-2 font-medium text-center">Estado</th>
              <th className="px-4 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">{order.id.substring(0, 8)}...</td>
                <td className="px-4 py-2">{order.cliente?.nombre || order.cliente?.email || 'N/A'}</td>
                <td className="px-4 py-2">{new Date(order.fecha_creacion).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right">${order.monto_total?.toFixed(2) ?? '0.00'}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    order.estado === 'entregado' || order.estado === 'completado' ? 'bg-green-100 text-green-800' :
                    order.estado === 'cancelado' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800' // Para 'procesando', 'enviado', etc.
                  }`}>
                    {order.estado?.charAt(0).toUpperCase() + order.estado?.slice(1) || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {/* Asume una ruta de detalle de orden en el admin */}
                  <Link href={`/ordenes/${order.id}`} className="text-blue-600 hover:underline text-xs">
                    Ver Detalles
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}