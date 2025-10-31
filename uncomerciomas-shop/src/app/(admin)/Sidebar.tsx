"use client"; // Necesario para usePathname

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Hook para saber la ruta actual
import { cn } from '@/lib/utils'; // Tu utilidad para clases condicionales

// --- Iconos de Lucide ---
import {
  LayoutDashboard,
  Box,
  FileText,
  Building,
  Folder,
  ShoppingCart,
  PlusCircle,
  Package,
  BadgeCheck,
  Handbag,
} from 'lucide-react';

// Define los enlaces del sidebar
const sidebarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/categorias', label: 'Colecciones', icon: Folder },
  { href: '/sucursales', label: 'Sucursales', icon: Building },
  { href: '/productos', label: 'Productos', icon: Handbag }, 
  { href: '/ordenes', label: 'Órdenes', icon: ShoppingCart },
    { href: '/inventario', label: 'Inventario', icon: Package},

  // ... (otros enlaces)
];

// Enlaces de "Acción Rápida" (ej. crear nuevo)
const actionLinks = [
  { href: '/productos/create', label: 'Crear Producto', icon: PlusCircle }
];

export default function Sidebar() {
  const pathname = usePathname(); // Obtiene la ruta actual (ej: '/dashboard')

  // Helper para 'isActive'
  const checkIsActive = (href: string) => {
    // Lógica exacta para la ruta base
    if (href === '/dashboard') return pathname === href;
    
    // Lógica para el resto de rutas (que coincida el inicio)
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-lg">
      {/* Logo o Título */}
      <div className="p-4 h-16 flex items-center border-b border-gray-800">
        <Link href="/dashboard" className="text-xl font-bold hover:text-gray-300 transition-colors">
          UnComercioMas
        </Link>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        <span className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Gestión
        </span>
        {sidebarLinks.map((link) => {
          const isActive = checkIsActive(link.href);
          const Icon = link.icon; // Componente de icono
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
                isActive 
                  ? "bg-gray-800 text-white" // Estilo activo
                  : "text-gray-400 hover:bg-gray-700 hover:text-white" // Estilo inactivo
              )}
            >
              <Icon className="mr-3 h-5 w-5" /> 
              {link.label}
            </Link>
          );
        })}
        
        {/* Sección de Acciones Rápidas */}
        <span className="px-3 py-2 pt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Acciones
        </span>
         {actionLinks.map((link) => {
          const isActive = checkIsActive(link.href);
          const Icon = link.icon; 
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
                isActive 
                  ? "bg-gray-800 text-white" 
                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
              )}
            >
              <Icon className="mr-3 h-5 w-5" /> 
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-4 border-t border-gray-800 mt-auto">
        <p className="text-sm text-gray-300">Usuario: Admin</p>
        <button className="text-xs text-red-400 hover:text-red-300 w-full text-left mt-1">
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
