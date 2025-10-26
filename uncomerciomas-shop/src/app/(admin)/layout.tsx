// src/app/(admin)/layout.tsx
import Sidebar from './Sidebar'; // Importaremos el Sidebar que crearemos

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Fijo */}
      <Sidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto"> 
        {/* 'children' representa la página actual (ej. dashboard/page.tsx) */}
        {children} 
      </main>
    </div>
  );
}