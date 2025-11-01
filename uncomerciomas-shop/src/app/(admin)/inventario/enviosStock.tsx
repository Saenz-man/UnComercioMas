"use client";

import React, { useMemo, useState } from 'react';
// ✅ CORREGIDO: Importar Branch desde su archivo de tipos
import { useBranches } from '@/hooks/useBranches';
import type { Branch } from '@/types/branch.types'; 
import { InventoryItem } from '@/hooks/useInventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Loader2 } from 'lucide-react';

interface EnviosStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemsToTransfer: InventoryItem[];
  onBranchSelect: (branch: Branch) => void; 
}

export function EnviosStockModal({ isOpen, onClose, itemsToTransfer, onBranchSelect }: EnviosStockModalProps) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const { data: branches, isLoading, error } = useBranches();

  const destinationBranches = useMemo(() => {
    if (!branches) return [];
    return branches.filter(branch => !branch.es_matriz);
  }, [branches]);

  const handleNextStep = () => {
    if (!selectedBranch) return;
    onBranchSelect(selectedBranch); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transferir Inventario</DialogTitle>
          <DialogDescription>
            Paso 1: Elige la sucursal de destino para los{" "}
            <strong>{itemsToTransfer.length} items</strong> seleccionados.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <h4 className="mb-4 text-sm font-medium text-gray-800">
            Sucursales Disponibles
          </h4>

          {isLoading && (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Cargando sucursales...</span>
            </div>
          )}
          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" /> Error al cargar sucursales.
            </div>
          )}

          {!isLoading && !error && (
            <ScrollArea className="h-[300px] w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {destinationBranches.length === 0 && (
                  <p className="text-sm text-gray-500 col-span-2">
                    No hay sucursales de destino (que no sean Matriz) registradas.
                  </p>
                )}
                
                {destinationBranches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => setSelectedBranch(branch)} 
                    data-selected={selectedBranch?.id === branch.id}
                    className="p-4 border rounded-lg text-left transition-all
                               hover:border-primary
                               focus:outline-none focus:ring-2 focus:ring-primary
                               data-[selected=true]:border-primary data-[selected=true]:ring-2 data-[selected=true]:ring-primary data-[selected=true]:bg-primary/5"
                  >
                    <p className="font-semibold text-gray-900">{branch.nombre}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {branch.direccion || 'Sin dirección'}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleNextStep}
            disabled={!selectedBranch || isLoading}
          >
            Siguiente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}