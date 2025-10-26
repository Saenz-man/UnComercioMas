// src/components/admin/Sidebar.tsx
"use client"; // Necesario para usePathname

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Hook para saber la ruta actual
import { cn } from '@/lib/utils'; // Tu utilidad para clases condicionales

// Define los enlaces del sidebar
const sidebarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' }, // Puedes usar SVGs o react-icons
  { href: '/categorias', label: 'Categorías', icon: '📁' },
  { href: '/sucursales', label: 'Sucursales', icon: '🏢' }, // Enlace futuro
  { href: '/productos', label: 'Productos', icon: '📦' }, // Enlace futuro
  { href: '/ordenes', label: 'Órdenes', icon: '🛒' },   // Enlace futuro
  // Añade más enlaces según necesites
];

export default function Sidebar() {
  const pathname = usePathname(); // Obtiene la ruta actual (ej: '/dashboard')

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col shadow-lg">
      {/* Logo o Título */}
      <div className="p-4 h-16 flex items-center border-b border-gray-700">
        <Link href="/dashboard" className="text-xl font-bold hover:text-gray-300">
          UnComercioMas
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
                isActive 
                  ? "bg-gray-900 text-white" // Estilo activo
                  : "text-gray-300 hover:bg-gray-700 hover:text-white" // Estilo inactivo
              )}
            >
              <span className="mr-3">{link.icon}</span> 
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Opcional: Footer del Sidebar (ej. Usuario, Logout) */}
      <div className="p-4 border-t border-gray-700 mt-auto">
        {/* Aquí podrías poner info del usuario o botón de logout */}
        <p className="text-xs text-gray-400">Usuario: Admin</p>
      </div>
    </aside>
  );
}