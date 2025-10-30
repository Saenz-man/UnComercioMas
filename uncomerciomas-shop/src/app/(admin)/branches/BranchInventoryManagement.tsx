"use client";

import { useState } from "react";
import type { Branch } from "@/types/branch.types";
import type { Product, ProductVariant } from "@/types/product.types";

// --- Tipos simulados ---
interface SimulatedProductVariant extends ProductVariant {
  producto?: { nombre: string };
}
interface InventoryItem {
  id: string;
  stock: number;
  variante: SimulatedProductVariant;
}

// --- Simulaciones de hooks ---
const useBranchInventory = (branchId: string | null) => ({
  data: [
    {
      id: "inv-1",
      stock: 50,
      variante: {
        id: "var-1",
        sku: "SKU-001",
        producto: { nombre: "Playera A" },
        atributos: { Talla: "M", Color: "Rojo" },
      },
    },
  ] as unknown as InventoryItem[],
  isLoading: false,
  error: null,
});

const useProducts = () => ({
  data: [
    {
      nombre: "Playera A",
      variantes: [
        {
          id: "var-1",
          sku: "SKU-001",
          atributos: { Talla: "M", Color: "Rojo" } as Record<string, string>,
        },
      ] as ProductVariant[],
    },
  ],
  isLoading: false,
});

// Los hooks de mutaciones ahora aceptan cualquier número de argumentos
const useAssignInventory = () => ({
  mutate: (..._args: any[]) => {},
  isPending: false,
  variables: null,
});
const useUpdateInventoryStock = () => ({
  mutate: (..._args: any[]) => {},
  isPending: false,
  variables: { inventoryId: "temp", stock: 0 },
});
const useDeleteInventoryItem = () => ({
  mutate: (..._args: any[]) => {},
  isPending: false,
  variables: null,
});

// --- Imports UI ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Trash2,
  Check,
  ChevronsUpDown,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BranchInventoryManagementProps {
  branch: Branch | null;
  isOpen: boolean;
  onClose: () => void;
}

// --- Componente Principal ---
export function BranchInventoryManagement({
  branch,
  isOpen,
  onClose,
}: BranchInventoryManagementProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [newStock, setNewStock] = useState<number>(0);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const {
    data: inventory = [],
    isLoading: isLoadingInventory,
    error: inventoryError,
  } = useBranchInventory(branch?.id ?? null);

  const { data: productsData, isLoading: isLoadingProducts } = useProducts();
  const assignMutation = useAssignInventory();
  const updateStockMutation = useUpdateInventoryStock();
  const deleteItemMutation = useDeleteInventoryItem();

  // --- Variantes disponibles ---
  const allVariants: SimulatedProductVariant[] =
    productsData?.flatMap(
      (p) =>
        p.variantes?.map((v) => ({
          ...v,
          producto: { nombre: p.nombre },
        })) || []
    ) || [];

  // --- Handlers ---
  const handleAssignVariant = () => {
    if (!branch || !selectedVariantId || newStock <= 0) {
      alert("El stock inicial debe ser mayor a cero.");
      return;
    }

    const isAlreadyAssigned = inventory.some(
      (item) => item.variante.id === selectedVariantId
    );
    if (isAlreadyAssigned) {
      alert(
        "Esta variante ya está asignada a la sucursal. Use el botón 'Actualizar'."
      );
      return;
    }

    assignMutation.mutate({
      sucursal_id: branch.id,
      variante_id: selectedVariantId,
      stock: newStock,
    });
    setSelectedVariantId(null);
    setNewStock(0);
  };

  const handleUpdateStock = (
    inventoryItem: InventoryItem,
    currentStockInputId: string
  ) => {
    const inputElement = document.getElementById(
      currentStockInputId
    ) as HTMLInputElement;
    if (!inputElement) return;

    const updatedStock = parseInt(inputElement.value, 10);
    if (isNaN(updatedStock) || updatedStock < 0) {
      alert("El stock debe ser un número positivo.");
      return;
    }

    if (
      updatedStock === 0 &&
      !window.confirm(
        `¿Estás seguro de que quieres establecer el stock a cero para ${inventoryItem.variante.sku}?`
      )
    ) {
      inputElement.value = inventoryItem.stock.toString();
      return;
    }

    updateStockMutation.mutate({
      inventoryId: inventoryItem.id,
      stock: updatedStock,
    });
  };

  const promptDeleteItem = (item: InventoryItem) => setItemToDelete(item);

  const handleConfirmDeleteItem = () => {
    if (!itemToDelete) return;
    deleteItemMutation.mutate(itemToDelete.id);
    setItemToDelete(null);
  };

  if (!branch) return null;

  const isLoading = isLoadingInventory || isLoadingProducts;
  const isMutating =
    assignMutation.isPending ||
    updateStockMutation.isPending ||
    deleteItemMutation.isPending;

  // --- Render ---
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestionar Inventario - {branch.nombre}</DialogTitle>
          <DialogDescription>
            Añade, elimina o actualiza el stock de los productos para esta
            sucursal.
          </DialogDescription>
        </DialogHeader>

        {/* Formulario para añadir producto */}
        <div className="flex flex-col sm:flex-row gap-4 items-end p-4 border rounded-md">
          <div className="flex-1 w-full sm:w-auto">
            <Label htmlFor="variant-select">Seleccionar Producto/Variante</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between mt-1"
                  disabled={isLoadingProducts}
                >
                  {selectedVariantId
                    ? allVariants.find((v) => v.id === selectedVariantId)?.sku ??
                      "Seleccionar variante..."
                    : "Seleccionar variante..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                <Command>
                  <CommandInput placeholder="Buscar SKU o nombre..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron variantes.</CommandEmpty>
                    <CommandGroup>
                      {allVariants.map((variant) => (
                        <CommandItem
                          key={variant.id}
                          value={`${variant.sku} ${variant.producto?.nombre} ${Object.values(
                            variant.atributos || {}
                          ).join(" ")}`}
                          onSelect={() => {
                            setSelectedVariantId(variant.id);
                            setPopoverOpen(false);
                          }}
                          disabled={inventory.some(
                            (item) => item.variante.id === variant.id
                          )}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedVariantId === variant.id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          <div>
                            <p className="font-medium">{variant.sku}</p>
                            <p className="text-xs text-muted-foreground">
                              {variant.producto?.nombre ?? "Producto Desconocido"} (
                              {Object.values(variant.atributos || {}).join("/") ||
                                "Sin Atributos"}
                              )
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-full sm:w-auto">
            <Label htmlFor="new-stock">Stock Inicial</Label>
            <Input
              id="new-stock"
              type="number"
              min="1"
              value={newStock}
              onChange={(e) => setNewStock(parseInt(e.target.value, 10) || 0)}
              className="mt-1"
              disabled={isMutating}
            />
          </div>
          <Button
            onClick={handleAssignVariant}
            disabled={!selectedVariantId || newStock <= 0 || isMutating}
            className="w-full sm:w-auto"
          >
            {assignMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Añadir a Inventario
          </Button>
        </div>

        {/* Tabla de inventario */}
        <div className="flex-1 overflow-y-auto mt-4">
          <h3 className="text-lg font-medium mb-2">Inventario Actual</h3>
          {isLoadingInventory && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {inventoryError && (
            <p className="text-red-500">
              Error al cargar inventario: {(inventoryError as any).message}
            </p>
          )}
          {!isLoadingInventory && !inventoryError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto (Variante)</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="w-[120px]">Stock Actual</TableHead>
                  <TableHead className="text-right w-[150px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      Esta sucursal no tiene inventario asignado.
                    </TableCell>
                  </TableRow>
                )}
                {inventory.map((item) => {
                  const stockInputId = `stock-${item.id}`;
                  const isUpdatingThisItem =
                    updateStockMutation.isPending &&
                    updateStockMutation.variables?.inventoryId === item.id;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.variante?.producto?.nombre ?? "Producto no encontrado"}{" "}
                        <span className="text-xs text-muted-foreground ml-1">
                          (
                          {Object.values(item.variante?.atributos ?? {}).join("/") ||
                            "N/A"}
                          )
                        </span>
                      </TableCell>
                      <TableCell>{item.variante?.sku ?? "N/A"}</TableCell>
                      <TableCell>
                        <Input
                          id={stockInputId}
                          type="number"
                          min="0"
                          defaultValue={item.stock}
                          className="h-8"
                          disabled={isMutating}
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStock(item, stockInputId)}
                          disabled={isMutating || isUpdatingThisItem}
                        >
                          {isUpdatingThisItem ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Actualizar"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => promptDeleteItem(item)}
                          disabled={isMutating}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>

      {/* Confirmación de eliminación */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar <strong>{itemToDelete?.variante?.sku}</strong> del inventario?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteItemMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteItem}
              disabled={deleteItemMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteItemMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
