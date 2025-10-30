"use client";
// 🛑 IMPORTS NECESARIOS
import { useInventory, InventoryItem, useUpdateInventoryStock, useDeleteInventoryItem } from "@/hooks/useInventory";
import { AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from "react";
import { toast } from 'sonner';

// --- Importa tus componentes UI ---
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UpdateStockModal } from './UpdateStockModal';
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

// =======================================================
// 1. TIPOS
// =======================================================
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

// =======================================================
// 2. LÓGICA: FUNCIÓN PARA AGRUPAR
// =======================================================
const groupInventoryByProduct = (items: InventoryItem[]): GroupedProduct[] => {
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
                categoriaNombre: (p.categoria as any)?.nombre || 'Sin Categoría',
                modelo: p.modelo || 'N/A',
            });
        }
        const group = productMap.get(p.id)!;
        group.totalStock += item.stock;
        group.variantes.push(item);
    }
    return Array.from(productMap.values());
};

// =======================================================
// 3. COMPONENTE DE FILA EXPANDIBLE (CON LOGS)
// =======================================================
const ProductRow = ({ product }: { product: GroupedProduct }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const optionKeys = Object.keys(product.variantes[0]?.variante.atributos || {});
    const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
    const deleteInventoryItemMutation = useDeleteInventoryItem();
    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

    const handleDeleteConfirm = (inventoryItemId: string, sku: string) => {
        deleteInventoryItemMutation.mutate(inventoryItemId, {
            onSuccess: () => {
                toast.success(`Entrada de inventario para ${sku} eliminada.`);
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
            {/* --- Fila Padre --- */}
            <TableRow className="hover:bg-gray-100 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                 <TableCell className="w-[80px]">
                    <div className="h-12 w-12 rounded-lg overflow-hidden border">
                        <img
                            src={productPhotoUrl}
                            alt={product.nombre}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/50x50/CCCCCC/333333?text=N/A';
                            }}
                        />
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

            {/* --- Fila Variante --- */}
            {isExpanded && (
                <TableRow className="bg-gray-50 hover:bg-gray-50 transition-none">
                    <TableCell colSpan={7} className="p-0 border-b-2 border-primary/10">
                        <div className="p-4 pl-16">
                            <h4 className="text-sm font-medium mb-3 text-primary">Detalles de Variantes ({product.variantes.length})</h4>
                            <Table className="w-full bg-white border rounded-lg">
                                <TableHeader className="bg-gray-100">
                                    <TableRow className="hover:bg-gray-100">
                                        <TableHead className="w-[80px]">Foto</TableHead>
                                        <TableHead>SKU</TableHead>
                                        {optionKeys.map(key => (<TableHead key={key}>{key}</TableHead>))}
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {product.variantes.map((item) => {

                                        // --- LOG #1: VER DATOS CRUDOS ---
                                        console.log(`[Inventario] Datos crudos de item.variante para SKU ${item.variante.sku}:`, item.variante);
                                        // ---------------------------------

                                        const variantSpecificPhotoPath = (item.variante as any)?.foto_variante; // Usamos el nombre correcto de tu entidad/BD

                                        // --- LOG #2: VER PATH ESPECÍFICO ---
                                        console.log(`[Inventario] variantSpecificPhotoPath para SKU ${item.variante.sku}:`, variantSpecificPhotoPath);
                                        // ----------------------------------

                                        const variantPhotoPath = variantSpecificPhotoPath
                                            ? variantSpecificPhotoPath
                                            : 'https://placehold.co/40x40/CCCCCC/333333?text=Var';

                                        // --- LOG #3: VER PATH FINAL (ANTES DE URL) ---
                                        console.log(`[Inventario] variantPhotoPath final para SKU ${item.variante.sku}:`, variantPhotoPath);
                                        // -----------------------------------------

                                        const variantPhotoUrl = (variantPhotoPath && !variantPhotoPath.startsWith('http'))
                                            ? `${SERVER_URL}${variantPhotoPath}`
                                            : variantPhotoPath;

                                        // --- LOG #4: VER URL FINAL QUE SE USARÁ EN IMG ---
                                        console.log(`[Inventario] variantPhotoUrl FINAL para SKU ${item.variante.sku}:`, variantPhotoUrl);
                                        // ----------------------------------------------

                                        return (
                                        <TableRow key={item.id} className="text-sm">
                                            <TableCell className="w-[80px]">
                                                <div className="h-10 w-10 rounded-md overflow-hidden border">
                                                    <img
                                                        src={variantPhotoUrl} // <-- Usamos la URL final
                                                        alt={item.variante.sku}
                                                        className="h-full w-full object-cover"
                                                        // Añadimos un onError aquí también para depurar si la URL falla
                                                        onError={(e) => {
                                                             console.error(`[Inventario] Error al cargar imagen para ${item.variante.sku}:`, variantPhotoUrl);
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/FF0000/FFFFFF?text=ERR'; // Placeholder de error
                                                        }}
                                                    />
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
                                                {/* ... Botones ... */}
                                                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setItemToEdit(item); }}>Editar Stock</Button>
                                                <AlertDialog onOpenChange={(open) => !open && setItemToDelete(null)}>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }} disabled={deleteInventoryItemMutation.isPending}>Eliminar</Button>
                                                    </AlertDialogTrigger>
                                                    {itemToDelete && itemToDelete.id === item.id && (
                                                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                            <AlertDialogHeader> <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle> <AlertDialogDescription> Se eliminará la entrada de inventario para el SKU <strong>{itemToDelete.variante.sku}</strong> ({Object.values(itemToDelete.variante.atributos || {}).join('/')}) de la Matriz. Esta acción no se puede deshacer. </AlertDialogDescription> </AlertDialogHeader>
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

            {/* Modal */}
            {itemToEdit && (<UpdateStockModal item={itemToEdit} isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)}/>)}
        </>
    );
};

// =======================================================
// 4. COMPONENTE PRINCIPAL
// =======================================================
export default function Inventario() {
  const { data: inventario, isLoading, error } = useInventory();
  const groupedInventory = inventario ? groupInventoryByProduct(inventario) : [];

  if (isLoading) {
    return ( <div className="p-8 flex justify-center items-center h-full"> <Loader2 className="h-6 w-6 mr-2 animate-spin" /> Cargando Inventario de la Matriz... </div> );
  }
  if (error) {
    return ( <div className="p-8 text-red-600 flex items-center"> <AlertCircle className="h-5 w-5 mr-2" /> Error al cargar el inventario: {(error as any).message} </div> );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Inventario de la Sucursal Matriz</h1>
      {groupedInventory.length === 0 ? (
        <div className="p-10 border border-dashed text-center text-gray-500 rounded-lg"> No hay productos cargados en el inventario de la Matriz. </div>
      ) : (
        <div className="border rounded-lg shadow-xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100">
                        <TableHead className="w-[80px]">Foto</TableHead>
                        <TableHead>Producto Padre</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="text-right">Stock Total</TableHead>
                        <TableHead className="text-center">Detalle</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groupedInventory.map((product) => ( <ProductRow key={product.productId} product={product} /> ))}
                </TableBody>
            </Table>
        </div>
      )}
    </div>
  );
}