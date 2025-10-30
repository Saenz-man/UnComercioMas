// src/app/(admin)/layout.tsx
import Sidebar from './Sidebar'; // Importa tu componente Sidebar
import { Toaster } from "@/components/ui/sonner"; // 🔔 Importa el Toaster

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // No necesitamos <html> or <body> aquí si este layout está anidado
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Fijo */}
      <Sidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* 'children' representa la página actual */}
        {children}
      </main>

      {/* ✨ Componente Toaster para las notificaciones */}
      <Toaster position="top-right" richColors />
    </div>
  );
}