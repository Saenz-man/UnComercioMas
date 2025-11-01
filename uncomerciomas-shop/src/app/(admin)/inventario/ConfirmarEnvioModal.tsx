"use client";

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { InventoryItem } from '@/hooks/useInventory';
import { useMatrizId } from '@/hooks/useBranches';
import type { Branch } from '@/types/branch.types';
// Asumo que el hook de mutación está en un archivo como este
import { useTransferStock } from '@/hooks/useInventoryMutations'; 

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// --- Esquema de Validación ---
const TransferItemSchema = z.object({
  inventoryId: z.string(),
  varianteId: z.string(),
  sku: z.string(),
  // ✅ CORREGIDO: z.record() necesita 2 argumentos (llave y valor)
  atributos: z.record(z.string(), z.string()).optional(), 
  stockActual: z.number(),
  cantidadAEnviar: z.number().int().min(0, "Debe ser 0 o más"),
});

const TransferFormSchema = z.object({
  items: z.array(TransferItemSchema),
}).refine(data => data.items.some(item => item.cantidadAEnviar > 0), {
  message: "Debes enviar al menos 1 unidad de algún producto.",
  path: ["items"], // Error global
});

type TransferFormValues = z.infer<typeof TransferFormSchema>;

// --- Props del Modal ---
interface ConfirmarEnvioModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemsToTransfer: InventoryItem[];
  destinationBranch: Branch;
}

export function ConfirmarEnvioModal({ isOpen, onClose, itemsToTransfer, destinationBranch }: ConfirmarEnvioModalProps) {
  const queryClient = useQueryClient();
  
  const transferMutation = useTransferStock();
  const matrizId = useMatrizId();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<TransferFormValues>({
    resolver: zodResolver(TransferFormSchema),
    defaultValues: {
      items: itemsToTransfer.map(item => ({
        inventoryId: item.id,
        varianteId: item.variante.id,
        sku: item.variante.sku,
        atributos: item.variante.atributos,
        stockActual: item.stock,
        cantidadAEnviar: 0,
      })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = async (data: TransferFormValues) => {
    if (!matrizId) {
      toast.error("Error: No se pudo identificar la sucursal Matriz de origen.");
      return;
    }

    let validationFailed = false;
    data.items.forEach((item, index) => {
      if (item.cantidadAEnviar > item.stockActual) {
        setError(`items.${index}.cantidadAEnviar`, {
          type: "manual",
          message: `No puedes enviar más de ${item.stockActual}.`
        });
        validationFailed = true;
      }
    });

    if (validationFailed) {
      toast.error("Hay errores en las cantidades.", { description: "Revisa los items marcados en rojo." });
      return;
    }

    const itemsToSubmit = data.items.filter(item => item.cantidadAEnviar > 0);

    toast.loading(`Iniciando ${itemsToSubmit.length} transferencias...`);

    const transferPromises = itemsToSubmit.map(item =>
      transferMutation.mutateAsync({
        source_branch_id: matrizId,
        destination_branch_id: destinationBranch.id,
        variante_id: item.varianteId,
        quantity: item.cantidadAEnviar,
      })
    );

    try {
      const results = await Promise.allSettled(transferPromises);

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      toast.dismiss();
      if (failedCount > 0) {
        toast.warning(`Transferencia completada con ${failedCount} errores.`, {
          description: `${successCount} items se transfirieron correctamente.`
        });
      } else {
        toast.success("¡Transferencia completada!", {
          description: `${successCount} items se transfirieron a ${destinationBranch.nombre}.`
        });
      }

    } catch (error) {
      toast.dismiss();
      toast.error("Error crítico durante la transferencia.");
    } finally {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar Transferencia</DialogTitle>
          <DialogDescription>
            Paso 2: Define las cantidades a enviar a <strong>{destinationBranch.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="h-[400px] w-full p-1">
            <div className="space-y-4 pr-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-5 gap-4 items-start border p-3 rounded-lg">
                  {/* Info del Producto */}
                  <div className="col-span-3">
                    <Label htmlFor={`items.${index}.cantidadAEnviar`} className="font-semibold text-gray-900">
                      {field.sku}
                    </Label>
                    <p className="text-xs text-gray-600">
                      {Object.values(field.atributos || {}).join(' / ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Stock actual: <span className="font-bold">{field.stockActual}</span>
                    </p>
                  </div>
                  
                  {/* Input de Cantidad */}
                  <div className="col-span-2">
                    <Input
                      id={`items.${index}.cantidadAEnviar`}
                      type="number"
                      placeholder="0"
                      min="0"
                      max={field.stockActual}
                      {...control.register(`items.${index}.cantidadAEnviar`, {
                        valueAsNumber: true,
                        max: {
                          value: field.stockActual,
                          message: "No puedes enviar más del stock actual."
                        }
                      })}
                      className={errors.items?.[index]?.cantidadAEnviar ? 'border-destructive' : ''}
                    />
                    {errors.items?.[index]?.cantidadAEnviar && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.items[index].cantidadAEnviar.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {errors.items && (
            <p className="text-sm text-destructive mt-4 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {errors.items.message}
            </p>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmar y Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}