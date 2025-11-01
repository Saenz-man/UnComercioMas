"use client";
// 1. IMPORTAMOS useBranchInventory (el único que usaremos) y el hook de matriz
import { InventoryItem, useUpdateInventoryStock, useDeleteInventoryItem, useBranchInventory } from "@/hooks/useInventory";
import { useMatrizId, useBranches } from "@/hooks/useBranches"; 
import { AlertCircle, Loader2, ChevronDown, ChevronUp, MoveRight } from 'lucide-react';
import { useState, useMemo } from "react";
import { toast } from 'sonner';
import { useQueryClient } from "@tanstack/react-query";

// ... (El resto de tus imports de UI, Modales y Tipos se quedan igual) ...
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UpdateStockModal } from './UpdateStockModal';
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { EnviosStockModal } from './enviosStock';
import { ConfirmarEnvioModal } from './ConfirmarEnvioModal';
import type { Branch } from '@/types/branch.types';


// ... (El Tipo 'GroupedProduct' y la función 'groupInventoryByProduct' se quedan igual) ...
interface GroupedProduct {
    productId: string;
    nombre: string;
    totalStock: number;
    variantes: InventoryItem[];
    foto: string;
    precio: number;
    categoriaNombre: string;
    modelo: string;
}
const groupInventoryByProduct = (items: InventoryItem[]): GroupedProduct[] => {
    // ... (lógica de agrupación sin cambios)
    const productMap = new Map<string, GroupedProduct>();
    for (const item of items) {
        const p = item.variante?.producto;
        if (!p) {
            console.warn(`Item de inventario con ID ${item.id} no tiene producto padre definido.`);
            continue;
        }
        const safePrice = parseFloat(p.precioPorPieza as any) || 0;
        if (!productMap.has(p.id)) {
            productMap.set(p.id, {
                productId: p.id,
                nombre: p.nombre,
                totalStock: 0,
                variantes: [],
                foto: p.fotos?.[0] || 'https://placehold.co/50x50/CCCCCC/333333?text=Foto',
                precio: safePrice,
                categoriaNombre: (p.categoria as any)?.nombre || 'Sin Coleccion',
                modelo: p.modelo || 'N/A',
            });
        }
        const group = productMap.get(p.id)!;
        group.totalStock += item.stock;
        group.variantes.push(item);
    }
    return Array.from(productMap.values());
};

// ... (El componente 'ProductRow' se queda exactamente igual) ...
interface ProductRowProps {
  product: GroupedProduct;
  selectedItems: InventoryItem[];
  setSelectedItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  isMatriz: boolean;
}
const ProductRow = ({ product, selectedItems, setSelectedItems, isMatriz }: ProductRowProps) => {
    // ... (Todo el JSX y lógica de ProductRow se queda igual)
    const [isExpanded, setIsExpanded] = useState(false);
    const optionKeys = Object.keys(product.variantes[0]?.variante.atributos || {});
    const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
    const deleteInventoryItemMutation = useDeleteInventoryItem();
    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;
    const queryClient = useQueryClient();

    const handleSelectVariant = (item: InventoryItem, checked: boolean) => {
        if (checked) {
            setSelectedItems(prev => [...prev, item]);
        } else {
            setSelectedItems(prev => prev.filter(i => i.id !== item.id));
        }
    };

    const handleSelectAllProduct = (checked: boolean) => {
        if (checked) {
            setSelectedItems(prev => {
                const newItems = product.variantes.filter(v => !prev.some(p => p.id === v.id));
                return [...prev, ...newItems];
            });
        } else {
            const variantIds = new Set(product.variantes.map(v => v.id));
            setSelectedItems(prev => prev.filter(i => !variantIds.has(i.id)));
        }
    };
    
    const isThisProductFullySelected = product.variantes.length > 0 && product.variantes.every(v => selectedItems.some(i => i.id === v.id));
    
    const handleDeleteConfirm = (inventoryItemId: string, sku: string) => {
        deleteInventoryItemMutation.mutate(inventoryItemId, {
            onSuccess: () => {
                toast.success(`Entrada de inventario para ${sku} eliminada.`);
                queryClient.invalidateQueries({ queryKey: ['branchInventory'] }); // Usamos la key correcta
                setItemToDelete(null);
            },
            onError: (error: any) => {
                toast.error(`Error al eliminar: ${error.response?.data?.message || 'No se pudo eliminar.'}`);
                setItemToDelete(null);
            }
        });
    };

    const productPhotoUrl = (product.foto && !product.foto.startsWith('http'))
        ? `${SERVER_URL}${product.foto}`
        : product.foto;

    return (
        <>
            <TableRow className="hover:bg-gray-100 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                 <TableCell className="w-20"> 
                    <div className="h-12 w-12 rounded-lg overflow-hidden border">
                        <img src={productPhotoUrl} alt={product.nombre} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/50x50/CCCCCC/333333?text=N/A'; }} />
                    </div>
                </TableCell>
                 <TableCell className="font-medium">{product.nombre}</TableCell>
                <TableCell>{product.categoriaNombre}</TableCell>
                <TableCell>{product.modelo}</TableCell>
                <TableCell>${product.precio.toFixed(2)}</TableCell>
                <TableCell className="text-right font-bold text-base">{product.totalStock}</TableCell>
                <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </TableCell>
            </TableRow>
            {isExpanded && (
                <TableRow className="bg-gray-50 hover:bg-gray-50 transition-none">
                    <TableCell colSpan={isMatriz ? 7 : 6} className="p-0 border-b-2 border-primary/10"> {/* Colspan dinámico */}
                        <div className="p-4 pl-16">
                            <h4 className="text-sm font-medium mb-3 text-primary">Detalles de Variantes ({product.variantes.length})</h4>
                            <Table className="w-full bg-white border rounded-lg">
                                <TableHeader className="bg-gray-100">
                                    <TableRow className="hover:bg-gray-100">
                                        {isMatriz && (
                                            <TableHead className="w-10 px-3">
                                                <Checkbox
                                                    id={`select-all-${product.productId}`}
                                                    aria-label="Seleccionar todas las variantes de este producto"
                                                    checked={isThisProductFullySelected}
                                                    onCheckedChange={handleSelectAllProduct}
                                                />
                                            </TableHead>
                                        )}
                                        <TableHead className="w-20">Foto</TableHead>
                                        <TableHead>SKU</TableHead>
                                        {optionKeys.map(key => (<TableHead key={key}>{key}</TableHead>))}
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {product.variantes.map((item) => {
                                        const variantSpecificPhotoPath = (item.variante as any)?.foto_variante;
                                        const variantPhotoPath = variantSpecificPhotoPath ? variantSpecificPhotoPath : 'https://placehold.co/40x40/CCCCCC/333333?text=Var';
                                        const variantPhotoUrl = (variantPhotoPath && !variantPhotoPath.startsWith('http')) ? `${SERVER_URL}${variantPhotoPath}` : variantPhotoPath;
                                        const isSelected = selectedItems.some(i => i.id === item.id);

                                        return (
                                        <TableRow key={item.id} className="text-sm">
                                            {isMatriz && (
                                                <TableCell className="px-3">
                                                    <Checkbox
                                                        id={`select-${item.id}`}
                                                        aria-label={`Seleccionar ${item.variante.sku}`}
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) => handleSelectVariant(item, !!checked)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell className="w-20">
                                                <div className="h-10 w-10 rounded-md overflow-hidden border">
                                                    <img src={variantPhotoUrl} alt={item.variante.sku} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/FF0000/FFFFFF?text=ERR'; }} />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{item.variante.sku}</TableCell>
                                            {optionKeys.map(key => (
                                                <TableCell key={key}>
                                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                                        {(item.variante.atributos && item.variante.atributos[key]) || '-'}
                                                    </span>
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-right font-semibold">{item.stock}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setItemToEdit(item); }}>Editar Stock</Button>
                                                <AlertDialog onOpenChange={(open) => !open && setItemToDelete(null)}>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }} disabled={deleteInventoryItemMutation.isPending}>Eliminar</Button>
                                                    </AlertDialogTrigger>
                                                    {itemToDelete && itemToDelete.id === item.id && (
                                                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                            <AlertDialogHeader> <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle> <AlertDialogDescription> Se eliminará la entrada de inventario para el SKU <strong>{itemToDelete.variante.sku}</strong> ({Object.values(itemToDelete.variante.atributos || {}).join('/')}). Esta acción no se puede deshacer. </AlertDialogDescription> </AlertDialogHeader>
                                                            <AlertDialogFooter> <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel> <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteConfirm(itemToDelete.id, itemToDelete.variante.sku)} disabled={deleteInventoryItemMutation.isPending}> {deleteInventoryItemMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : 'Sí, eliminar'} </AlertDialogAction> </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    )}
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </TableCell>
                </TableRow>
            )}
            {itemToEdit && (<UpdateStockModal item={itemToEdit} isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)}/>)}
        </>
    );
};


// =======================================================
// 4. COMPONENTE PRINCIPAL (ACTUALIZADO)
// =======================================================
// ✅ AHORA RECIBE 'branchId' COMO PROP OBLIGATORIA
export default function InventarioDetail({ branchId }: { branchId: string }) { 
  
  const matrizId = useMatrizId(); // Obtener el ID de la Matriz

  // ✅ YA NO HAY LÓGICA DE FALLBACK. USAMOS EL ID RECIBIDO.
  const { data: inventario, isLoading: isLoadingInventory, error: inventoryError } = useBranchInventory(branchId);
  
  const { data: allBranches, isLoading: isLoadingBranches } = useBranches();
  
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [isStep1ModalOpen, setIsStep1ModalOpen] = useState(false);
  const [isStep2ModalOpen, setIsStep2ModalOpen] = useState(false);
  const [selectedDestinationBranch, setSelectedDestinationBranch] = useState<Branch | null>(null);

  // ✅ 'isMatriz' AHORA SE CALCULA COMPARANDO EL ID DE LA PROP CON EL ID DE LA MATRIZ
  const isMatriz = branchId === matrizId;

  // Título dinámico
  const title = useMemo(() => {
    if (!branchId || !allBranches) return "Cargando Inventario...";
    const currentBranch = allBranches.find(b => b.id === branchId);
    return currentBranch ? `Inventario de ${currentBranch.nombre}` : "Inventario";
  }, [branchId, allBranches]);


  const isLoading = isLoadingInventory || isLoadingBranches;

  if (isLoading) {
    return ( <div className="p-8 flex justify-center items-center h-full"> <Loader2 className="h-6 w-6 mr-2 animate-spin" /> Cargando Inventario... </div> );
  }
  if (inventoryError) {
    return ( <div className="p-8 text-red-600 flex items-center"> <AlertCircle className="h-5 w-5 mr-2" /> Error al cargar el inventario: {(inventoryError as any).message} </div> );
  }

  // (Funciones para manejar modales, sin cambios)
  const handleBranchSelected = (branch: Branch) => {
    setSelectedDestinationBranch(branch);
    setIsStep1ModalOpen(false);
    setIsStep2ModalOpen(true);
  };
  const handleCloseStep2 = () => {
    setIsStep2ModalOpen(false);
    setSelectedDestinationBranch(null);
    setSelectedItems([]);
  };

  const groupedInventory = inventario ? groupInventoryByProduct(inventario) : [];

  return (
    <div className="p-4 md:p-8 space-y-6">
      
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        
        {isMatriz && selectedItems.length > 0 && (
            <Button 
                size="lg" 
                onClick={() => setIsStep1ModalOpen(true)}
            >
                <MoveRight className="h-4 w-4 mr-2" />
                Transferir {selectedItems.length} {selectedItems.length === 1 ? 'Item' : 'Items'}
            </Button>
        )}
      </div>
      
      {groupedInventory.length === 0 ? (
        <div className="p-10 border border-dashed text-center text-gray-500 rounded-lg"> No hay productos cargados en el inventario de esta sucursal. </div>
      ) : (
        <div className="border rounded-lg shadow-xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100">
                        <TableHead className="w-20">Foto</TableHead> 
                        <TableHead>Producto Padre</TableHead>
                        <TableHead>Coleccion</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="text-right">Stock Total</TableHead>
                        <TableHead className="text-center">Detalle</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groupedInventory.map((product) => (
                        <ProductRow 
                            key={product.productId} 
                            product={product}
                            selectedItems={selectedItems}
                            setSelectedItems={setSelectedItems}
                            isMatriz={isMatriz} 
                        /> 
                    ))}
                </TableBody>
            </Table>
        </div>
      )}
      
      {isMatriz && (
        <>
          <EnviosStockModal
            isOpen={isStep1ModalOpen}
            onClose={() => setIsStep1ModalOpen(false)}
            itemsToTransfer={selectedItems}
            onBranchSelect={handleBranchSelected} 
          />
          {selectedDestinationBranch && (
            <ConfirmarEnvioModal
              isOpen={isStep2ModalOpen}
              onClose={handleCloseStep2}
              itemsToTransfer={selectedItems}
              destinationBranch={selectedDestinationBranch}
            />
          )}
        </>
      )}

    </div>
  );
}