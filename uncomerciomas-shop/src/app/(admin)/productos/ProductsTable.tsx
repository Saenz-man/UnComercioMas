"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useProducts, useBulkDeleteProducts, useDeleteVariant } from "@/hooks/useProducts";
import Link from "next/link";
import { Pencil, PackageSearch } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// --- Tipos ---
interface ProductVariant {
  id: string;
  sku: string;
  stock: number;
  atributos?: Record<string, string>;
  foto_variante?: string | null;
  precio?: number | string | null;
}
interface VolumePrice {
  cantidad_minima: number;
  precio: number | string;
}
interface ProductData {
  id: string;
  nombre: string;
  categoria?: { nombre: string } | null;
  modelo?: string | null;
  precioPorPieza: number | string;
  fotos?: string[] | null;
  variantes?: ProductVariant[] | null;
  preciosPorVolumen?: VolumePrice[] | null;
}
// --- Fin Tipos ---

const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return "-";
  const priceNum = parseFloat(price as string);
  if (isNaN(priceNum)) return "-";
  return `$${priceNum.toFixed(2)}`;
};

const normalizeString = (str: string | null | undefined): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const highlightText = (text: string | null | undefined, term: string) => {
  if (!term || !text) return text || "";
  const normalizedText = normalizeString(text);
  const normalizedTerm = normalizeString(term);
  if (normalizedTerm === "") return text;
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let startIndex = 0;
  while ((startIndex = normalizedText.indexOf(normalizedTerm, lastIndex)) > -1) {
    const endIndex = startIndex + normalizedTerm.length;
    if (startIndex > lastIndex) {
      result.push(<React.Fragment key={`pre-${lastIndex}`}>{text.substring(lastIndex, startIndex)}</React.Fragment>);
    }
    result.push(
      <mark key={`mark-${startIndex}`} className="bg-yellow-200 text-black px-0.5 rounded">
        {text.substring(startIndex, endIndex)}
      </mark>
    );
    lastIndex = endIndex;
  }
  if (lastIndex < text.length) {
    result.push(<React.Fragment key={`post-${lastIndex}`}>{text.substring(lastIndex)}</React.Fragment>);
  }
  return <>{result}</>;
};

export function ProductsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<{ type: "product" | "variant"; ids: string[] }>({
    type: "product",
    ids: [],
  });

  const { data: products, isLoading, error } = useProducts();
  const bulkDelete = useBulkDeleteProducts();
  const deleteVariant = useDeleteVariant();
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

  const normalizedTerm = normalizeString(searchTerm.trim());

  const calculateTotalStock = (variants: ProductVariant[] | undefined | null): number =>
    variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;

  // PASO 1: Primer useMemo solo para FILTRAR
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!normalizedTerm) return products;

    return products.filter((p: ProductData) => {
      const matchesProduct =
        normalizeString(p.nombre).includes(normalizedTerm) ||
        normalizeString(p.modelo).includes(normalizedTerm) ||
        normalizeString(p.categoria?.nombre).includes(normalizedTerm);

      const matchesVariant = p.variantes?.some((v) => {
        const attrs = normalizeString(Object.values(v.atributos || {}).join(" "));
        return normalizeString(v.sku).includes(normalizedTerm) || attrs.includes(normalizedTerm);
      });

      return matchesProduct || matchesVariant;
    });
  }, [products, normalizedTerm]);

  // ✅ PASO 2: Segundo useMemo para ORDENAR variantes y preparar la lista para renderizar
  const productsToRender = useMemo(() => {
    // Si no hay término de búsqueda, no necesitamos reordenar nada
    if (!normalizedTerm) {
      return filteredProducts;
    }

    // Si hay término, mapeamos la lista filtrada
    return filteredProducts.map(product => {
      // Si no hay variantes, devolvemos el producto tal cual
      if (!product.variantes || product.variantes.length === 0) {
        return product;
      }

      // Función para chequear si una variante coincide
      const variantMatches = (v: ProductVariant): boolean => {
        const attrs = normalizeString(Object.values(v.atributos || {}).join(" "));
        return normalizeString(v.sku).includes(normalizedTerm) || 
               attrs.includes(normalizedTerm);
      };

      // Creamos una nueva lista de variantes ordenadas
      const sortedVariants = [...product.variantes].sort((a, b) => {
        const aMatches = variantMatches(a);
        const bMatches = variantMatches(b);
        
        if (aMatches && !bMatches) return -1; // 'a' (coincide) va ANTES
        if (!aMatches && bMatches) return 1; // 'b' (coincide) va ANTES
        return 0; // Mantener orden relativo
      });

      // Devolvemos una COPIA del producto con las variantes reemplazadas por las ordenadas
      return {
        ...product,
        variantes: sortedVariants,
      };
    });
  }, [filteredProducts, normalizedTerm]); // Depende de la lista filtrada y el término


  useEffect(() => {
    if (!normalizedTerm) {
      setExpandedProductId(null);
      return;
    }

    // Usamos filteredProducts (la lista original filtrada) para el auto-expand
    // No necesitamos la lista con variantes ordenadas para esto
    const match = filteredProducts.find((p) =>
      p.variantes?.some((v) =>
        normalizeString(Object.values(v.atributos || {}).join(" ")).includes(normalizedTerm)
      )
    );
    if (match) setExpandedProductId(match.id);
  }, [normalizedTerm, filteredProducts]);

  const openConfirmModal = (type: "product" | "variant", ids: string[]) => {
    setItemsToDelete({ type, ids });
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    if (itemsToDelete.type === "product") {
      bulkDelete.mutate(itemsToDelete.ids);
      setSelectedProducts((prev) => prev.filter((id) => !itemsToDelete.ids.includes(id)));
    } else {
      itemsToDelete.ids.forEach((id) => deleteVariant.mutate(id));
      setSelectedVariants((prev) => prev.filter((id) => !itemsToDelete.ids.includes(id)));
    }
    setShowConfirm(false);
  };

  if (isLoading) return <div className="text-center py-6">Cargando productos...</div>;
  if (error) return <div className="text-center py-6 text-red-500">Error al cargar los productos.</div>;
  
  // Usamos productsToRender para la comprobación de "no hay productos"
  const noProducts = !productsToRender || productsToRender.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <input
          type="text"
          placeholder="Buscar productos o variantes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {noProducts ? (
         <div className="flex flex-col items-center justify-center p-10 border rounded-lg text-gray-500">
           <PackageSearch size={48} className="mb-4 text-muted-foreground" />
           No hay productos registrados.
           <Button asChild variant="link" className="mt-2">
             <Link href="/productos/create">Crear el primero</Link>
           </Button>
         </div>
      ) : (
        <>
          <div className="flex space-x-2 mb-2">
            {selectedProducts.length > 0 && (
              <Button variant="destructive" onClick={() => openConfirmModal("product", selectedProducts)}>
                Eliminar productos ({selectedProducts.length})
              </Button>
            )}
            {selectedVariants.length > 0 && (
              <Button variant="destructive" onClick={() => openConfirmModal("variant", selectedVariants)}>
                Eliminar variantes ({selectedVariants.length})
              </Button>
            )}
          </div>
          
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableCaption>Lista de tus productos registrados.</TableCaption>
              <TableHeader>
                <TableRow className="bg-gray-100 hover:bg-gray-100">
                  <TableHead className="w-10 px-2" />
                  <TableHead className="w-20">Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Coleccion</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="text-right">Precio Base</TableHead>
                  <TableHead className="text-right">Precio Volumen</TableHead>
                  <TableHead className="text-center"># Variantes</TableHead>
                  <TableHead className="text-center">Stock Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                  <TableHead className="w-12 text-center">Detalles</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* ✅ PASO 3: Mapeamos sobre la NUEVA lista 'productsToRender' */}
                {productsToRender.map((product: ProductData) => {
                  // 'product.variantes' ya viene ordenado si hay un término de búsqueda
                  
                  const totalStock = calculateTotalStock(product.variantes);
                  const isExpanded = expandedProductId === product.id;
                  const mainPhotoPath = product.fotos?.[0];
                  const mainPhotoUrl =
                    mainPhotoPath && !mainPhotoPath.startsWith("http")
                      ? `${SERVER_URL}${mainPhotoPath}`
                      : mainPhotoPath || "https://placehold.co/60x60/EEE/31343C?text=N/A";
                  const precioBaseNum = parseFloat(product.precioPorPieza as string) || 0;

                  return (
                    <React.Fragment key={product.id}>
                      <TableRow
                        className={`${isExpanded ? "bg-muted/50" : ""} hover:bg-muted/50 cursor-pointer`}
                        onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                      >
                        <TableCell className="px-2">
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedProducts([...selectedProducts, product.id]);
                              else setSelectedProducts(selectedProducts.filter((id) => id !== product.id));
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell>
                          <img
                            src={mainPhotoUrl}
                            alt={product.nombre}
                            width={60}
                            height={60}
                            className="rounded object-cover aspect-square border"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{highlightText(product.nombre, searchTerm)}</TableCell>
                        <TableCell>{highlightText(product.categoria?.nombre || "N/A", searchTerm)}</TableCell>
                        <TableCell>{highlightText(product.modelo || "-", searchTerm)}</TableCell>
                        <TableCell className="text-right">{formatPrice(precioBaseNum)}</TableCell>
                        <TableCell className="text-right text-xs text-primary font-semibold">
                          {product.preciosPorVolumen && product.preciosPorVolumen.length > 0 ? (
                            <div className="flex flex-col items-end">
                              {product.preciosPorVolumen.map((vp, idx) => (
                                <span key={idx}>
                                  {vp.cantidad_minima}+ : {formatPrice(vp.precio)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span>N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{product.variantes?.length || 0}</TableCell>
                        <TableCell className="text-center font-semibold">{totalStock}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="icon" title="Editar Producto" onClick={(e) => e.stopPropagation()}>
                            <Link href={`/productos/${product.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon">
                            {isExpanded ? "▲" : "▼"}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* 🌈 Variantes */}
                      {isExpanded && product.variantes && product.variantes.length > 0 && (
                        <TableRow key={`${product.id}-details`} className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={11} className="p-0">
                            <div className="p-4 space-y-4">
                              <h4 className="text-sm font-semibold mb-2 text-foreground">Variantes:</h4>
                              <div className="mb-2">
                                <Checkbox
                                  // 'product.variantes' aquí es la lista (potencialmente ordenada)
                                  checked={product.variantes.every((v) => selectedVariants.includes(v.id))}
                                  onCheckedChange={(checked) => {
                                    const ids = product.variantes!.map((v) => v.id);
                                    if (checked)
                                      setSelectedVariants([...new Set([...selectedVariants, ...ids])]);
                                    else setSelectedVariants(selectedVariants.filter((id) => !ids.includes(id)));
                                  }}
                                />{" "}
                                Seleccionar todas
                              </div>
                              <Table className="bg-background rounded border text-xs">
                                <TableHeader className="bg-gray-100">
                                  <TableRow>
                                    <TableHead className="w-10 px-2" />
                                    <TableHead>Foto</TableHead>
                                    <TableHead>SKU</TableHead>
                                    {Object.keys(product.variantes[0].atributos || {}).map((key) => (
                                      <TableHead key={key}>{key}</TableHead>
                                    ))}
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead className="text-right">Precio</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {/* Mapeamos sobre product.variantes, que ya está ordenado */}
                                  {product.variantes.map((v) => {
                                    const variantPhotoPath =
                                      v.foto_variante || "https://placehold.co/40x40/EEE/31343C?text=Var";
                                    const variantPhotoUrl =
                                      variantPhotoPath && !variantPhotoPath.startsWith("http")
                                        ? `${SERVER_URL}${variantPhotoPath}`
                                        : variantPhotoPath;
                                    return (
                                      <TableRow key={v.id}>
                                        <TableCell className="px-2">
                                          <Checkbox
                                            checked={selectedVariants.includes(v.id)}
                                            onCheckedChange={(checked) => {
                                              if (checked) setSelectedVariants([...selectedVariants, v.id]);
                                              else
                                                setSelectedVariants(selectedVariants.filter((id) => id !== v.id));
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <img
                                            src={variantPhotoUrl}
                                            alt={v.sku}
                                            className="w-10 h-10 rounded-md border object-cover"
                                          />
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                          {highlightText(v.sku, searchTerm)}
                                        </TableCell>
                                        {Object.keys(v.atributos || {}).map((key) => (
                                          <TableCell key={key}>
                                            {highlightText(v.atributos?.[key] || "-", searchTerm)}
                                          </TableCell>
                                        ))}
                                        <TableCell className="text-right">{v.stock}</TableCell>
                                        <TableCell className="text-right">{formatPrice(v.precio)}</TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Confirmar eliminación</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                {itemsToDelete.ids.length > 0 && (
                  <p>
                    ¿Estás seguro que deseas eliminar {itemsToDelete.ids.length}{" "}
                    {itemsToDelete.type === "product" ? "productos" : "variantes"}?
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirm(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}