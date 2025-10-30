//UnComercioMas/uncomerciomas-shop/src/app/(admin)/ordens/ordenes.tsx

"use client";

import { useState } from "react";

export default function Ordenes() {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => setIsOpen(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">¡Sección en construcción!</h2>
        <p className="mb-6">
          Esta sección aún no está disponible. Estamos trabajando para traerte la mejor experiencia.
        </p>
        <button
          onClick={handleClose}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
