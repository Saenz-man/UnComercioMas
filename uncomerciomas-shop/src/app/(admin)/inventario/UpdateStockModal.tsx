"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
// ✅ 1. IMPORTAR useQueryClient
import { useQueryClient } from '@tanstack/react-query'; 

// --- Tus componentes UI ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Hook de mutación e interfaz ---
import { useUpdateInventoryStock, InventoryItem } from '@/hooks/useInventory';

// --- Esquema de validación ---
const UpdateStockSchema = z.object({
  newStock: z.number().min(0, "El stock no puede ser negativo").int("El stock debe ser entero"),
  reason: z.string().optional(),
  adjustmentType: z.enum(['RECONTEO', 'AGREGAR', 'ELIMINAR']),
});

type UpdateStockFormValues = z.infer<typeof UpdateStockSchema>;

interface UpdateStockModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateStockModal({ item, isOpen, onClose }: UpdateStockModalProps) {
  const updateStockMutation = useUpdateInventoryStock();
  // ✅ 2. OBTENER EL CLIENTE DE CACHÉ
  const queryClient = useQueryClient();
  
  const [calculatedStock, setCalculatedStock] = useState<number>(Number(item.stock) || 0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateStockFormValues>({
    resolver: zodResolver(UpdateStockSchema),
    defaultValues: {
      newStock: Number(item.stock) || 0,
      adjustmentType: 'RECONTEO',
      reason: '',
    },
  });

  // Resetea el form si el item cambia
  useEffect(() => {
    const currentStock = Number(item.stock) || 0;
    reset({
      newStock: currentStock,
      adjustmentType: 'RECONTEO',
      reason: '',
    });
    setCalculatedStock(currentStock);
  }, [item, reset]);

  // Observa los cambios para calcular el stock final
  const adjustmentType = watch('adjustmentType');
  const newStockValue = watch('newStock');

  useEffect(() => {
    const currentStock = Number(item.stock) || 0;
    const value = Number(newStockValue) || 0; 

    let finalStock = currentStock; 

    if (adjustmentType === 'RECONTEO') {
      finalStock = value;
    } else if (adjustmentType === 'AGREGAR') {
      finalStock = currentStock + value;
    } else if (adjustmentType === 'ELIMINAR') {
      finalStock = currentStock - value;
    }
    
    setCalculatedStock(isNaN(finalStock) ? 0 : finalStock);

  }, [adjustmentType, newStockValue, item.stock]);


  const onSubmit = (data: UpdateStockFormValues) => {
    if (calculatedStock < 0) {
        toast.error("El stock final no puede ser negativo.");
        return;
    }

    updateStockMutation.mutate(
      {
        inventoryId: item.id,
        stock: calculatedStock, 
      },
      {
        onSuccess: () => {
          toast.success(`Stock de ${item.variante.sku} actualizado a ${calculatedStock}. Motivo: ${data.adjustmentType} ${data.reason ? `(${data.reason})` : ''}`);
          // ✅ 3. INVALIDAR LA CACHÉ PARA FORZAR RECARGA
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
          onClose(); // Cierra el modal
        },
        onError: (error: any) => {
          console.error("Error al actualizar stock:", error);
          toast.error(`Error: ${error.response?.data?.message || 'No se pudo actualizar el stock.'}`);
        },
      }
    );
  };

  const getLabelForStockInput = () => {
    switch(adjustmentType) {
        case 'AGREGAR': return 'Cantidad a Agregar';
        case 'ELIMINAR': return 'Cantidad a Eliminar';
        case 'RECONTEO':
        default: return 'Nuevo Stock Total (Reconteo)';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Stock</DialogTitle>
          <DialogDescription>
            Ajusta la cantidad de **{item.variante.sku}** ({Object.values(item.variante.atributos || {}).join(' / ')}) en la Matriz.
          </DialogDescription>
        </DialogHeader>

        <form id="update-stock-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* Tipo de Ajuste */}
          <div>
            <Label htmlFor="adjustmentType">Tipo de Ajuste</Label>
            <Select
              defaultValue={watch('adjustmentType')}
              onValueChange={(value: 'RECONTEO' | 'AGREGAR' | 'ELIMINAR') => setValue('adjustmentType', value)}
              disabled={updateStockMutation.isPending}
            >
              <SelectTrigger id="adjustmentType">
                <SelectValue placeholder="Selecciona el tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECONTEO">Reconteo (Stock Final)</SelectItem>
                <SelectItem value="AGREGAR">Agregar Mercancía</SelectItem>
                <SelectItem value="ELIMINAR">Eliminar Mercancía (Baja)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Input de Cantidad / Stock */}
          <div>
            <Label htmlFor="newStock">{getLabelForStockInput()}</Label>
            <Input
              id="newStock"
              type="number"
              step="1"
              placeholder="0"
              {...register("newStock", { valueAsNumber: true })}
              disabled={updateStockMutation.isPending}
              className={errors.newStock ? 'border-destructive' : ''}
            />
            {errors.newStock && (
              <p className="text-xs text-destructive mt-1">{errors.newStock.message}</p>
            )}
          </div>

          {/* Stock Actual y Calculado */}
          <div className="text-sm space-y-1 bg-gray-50 p-3 rounded-md border">
            <p>Stock Actual: <strong className="font-semibold">{Number(item.stock) || 0}</strong></p>
            <p>Stock Calculado Final:
              <strong className={`font-semibold ${calculatedStock < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {isNaN(calculatedStock) ? 0 : (calculatedStock < 0 ? `Inválido (${calculatedStock})` : calculatedStock)}
              </strong>
            </p>
          </div>

          {/* Motivo (Opcional) */}
          <div>
            <Label htmlFor="reason">Motivo del Ajuste (Opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Ej: Devolución, Merma, Recepción de proveedor..."
              {...register("reason")}
              disabled={updateStockMutation.isPending}
            />
          </div>

        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={updateStockMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="update-stock-form"
            disabled={updateStockMutation.isPending || calculatedStock < 0 || isNaN(calculatedStock)} 
          >
            {updateStockMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Actualizar Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}