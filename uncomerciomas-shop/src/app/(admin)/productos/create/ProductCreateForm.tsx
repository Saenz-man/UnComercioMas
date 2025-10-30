"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

// UI
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Trash2, X } from "lucide-react";

import { toast } from "sonner";

// Hooks (tu implementación)
import { useCategories } from "@/hooks/useCategories";
import { useAttributes } from "@/hooks/useAttributes";
import { useUpload } from "@/hooks/useUpload";
import { useCreateProduct } from "@/hooks/useProducts";

// Tipos
import { CreateProductPayload } from "@/types/product.types";
import { CreateProductVariantPayload } from "@/types/product-variant.types";

/* ===========================
   Zod Schemas (¡Sintaxis Corregida Definitivamente!)
   =========================== */
const variantSchema = z.object({
  sku: z.string().optional(), 
  stock: z.number().min(1, "Stock inicial requerido para la Matriz"), 
  foto: z.string().nullable().optional(),
  opciones: z.record(z.string(), z.string()).optional(),
  precio: z.number().min(0).optional(),
});

const productSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  modelo: z.string().optional(),
  descripcion: z.string().optional(),
  
  // --- ¡CORRECCIÓN DE PRECIO! ---
  // Establecemos el mensaje de error para la validación de TIPO (ej. si es 'undefined')
  precioPorPieza: z.number({
    message: "El precio debe ser un número.",
  })
  // Encadenamos la validación de VALOR (que sea > 0)
  .gt(0, "El precio debe ser mayor a 0"), // .gt() = "greater than"
  // ------------------------------

  slug: z.string().optional(),

  // --- ¡CORRECCIÓN DE CATEGORÍA! ---
  // Establecemos el mensaje de error para la validación de TIPO (ej. si es 'undefined')
  categoria_id: z.string({
    message: "Selecciona una categoría", 
  })
  // Encadenamos la validación de VALOR (que no sea un string vacío "")
  .min(1, "Selecciona una categoría"), 
  // ---------------------------------

  fotos: z.array(z.string()).optional(),
  video: z.string().nullable().optional(),
  preciosPorVolumen: z.array(
    z.object({
      cantidad_minima: z.number().min(0),
      precio: z.number().min(0),
    })
  ),
  opciones: z.record(z.string(), z.array(z.string())).optional(),
  variantes: z.array(variantSchema).min(1, "Se requiere al menos una variante"),
});

type ProductFormValues = z.infer<typeof productSchema>;

/* ===========================
   Util: combinación cartesiana (Mantenido)
   =========================== */
function getVariantCombinations(
  opciones: Record<string, string[]>
): Record<string, string>[] {
  const optionNames = Object.keys(opciones);
  if (optionNames.length === 0) return [];
  let results: Record<string, string>[] = [{}];
  for (const name of optionNames) {
    const values = opciones[name]?.filter(Boolean) || [];
    if (values.length === 0) continue;
    const newResults: Record<string, string>[] = [];
    for (const result of results) {
      for (const value of values) {
        newResults.push({ ...result, [name]: value });
      }
    }
    results = newResults;
  }
  return results.filter(
    (r) =>
      Object.keys(r).length ===
      optionNames.filter((n) => opciones[n]?.length > 0).length
  );
}

/* ===========================
   Componente
   =========================== */
export function ProductCreateForm() {
  const router = useRouter();
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;
  // Datos externos
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: attributes, isLoading: isLoadingAttributes } = useAttributes();
  const uploadFileMutation = useUpload();
  const createProductMutation = useCreateProduct();

  // Estado local para opciones editables y modal
  const [opcionesEditables, setOpcionesEditables] = useState<
    Record<string, string[]>
  >({
    Talla: ["XCH", "CH", "M", "G", "XG"],
    Color: ["Blanco", "Negro", "Azul"],
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [opcionParaAnadirValor, setOpcionParaAnadirValor] = useState<
    string | null
  >(null);
  const [nuevoValor, setNuevoValor] = useState("");

  // react-hook-form + zod
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nombre: "", // Cambiado a vacío para forzar input
      modelo: "",
      descripcion: "",
      precioPorPieza: 0, // Inicia en 0 o null
      slug: "",
      categoria_id: undefined,
      fotos: [],
      video: null,
      preciosPorVolumen: [{ cantidad_minima: 10, precio: 100 }],
      opciones: {},
      variantes: [],
    },
  });

  // Field arrays
  const {
    fields: volumeFields,
    append: appendVolume,
    remove: removeVolume,
  } = useFieldArray({ control, name: "preciosPorVolumen" });
  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control,
    name: "variantes",
  });

  const nombreProducto = watch("nombre");
  const precioPorPieza = watch("precioPorPieza"); // Observamos el precio base

  /* ===========================
     Efectos: sincronizar atributos (opcional)
     =========================== */
  useEffect(() => {
    // Si traes atributos y quieres inicializar opcionesEditables desde ahí:
    if (attributes && Object.keys(opcionesEditables).length === 0) {
      // ejemplo: mapear attributes a opcionesEditables si vienen en ese formato
      // setOpcionesEditables(...);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributes]);


  /* ===========================
     Handlers: opciones y variantes
     =========================== */
  const addOptionValue = (optionName: string, value: string) => {
    if (!value || !optionName) return;
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    setOpcionesEditables((prev) => {
      const prevArr = prev[optionName] ?? [];
      if (prevArr.includes(trimmedValue)) return prev;
      return { ...prev, [optionName]: [...prevArr, trimmedValue] };
    });
    setNuevoValor("");
    setModalOpen(false);
  };

  const removeOptionValue = (optionName: string, valueToRemove: string) => {
    setOpcionesEditables((prev) => ({
      ...prev,
      [optionName]: prev[optionName]?.filter((v) => v !== valueToRemove) || [],
    }));
  };

  const openAddValueModal = (optionName: string) => {
    setOpcionParaAnadirValor(optionName);
    setNuevoValor("");
    setModalOpen(true);
  };

  const handleGenerateVariants = () => {
    const combinations = getVariantCombinations(opcionesEditables);
    if (combinations.length === 0) {
      toast.info("Añade opciones y valores para generar variantes.");
      replaceVariants([]);
      setValue("opciones", {});
      return;
    }

    const newVariants: CreateProductVariantPayload[] = combinations.map(
      (combo) => ({
        // SKU: Idealmente generado en el backend o prellenado aquí
        sku: `${getValues("slug") || "SKU"}-${Object.values(combo).join("-")}`.toUpperCase(),
        // 🛑 Stock inicial en 1 como valor por default (para forzar la matriz)
        stock: 1, 
        foto: null,
        opciones: combo,
        // Precio por pieza del producto padre
        precio: precioPorPieza ?? 0, 
      })
    );

    replaceVariants(newVariants);
    setValue("opciones", opcionesEditables);
    toast.success(`${newVariants.length} variantes generadas/actualizadas.`);
  };

/* ===========================
     Handle Upload (¡Corregido Definitivamente!)
     =========================== */
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "video" | `fotos.${number}` | `variantes.${number}.foto`
  ) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      toast.error("El archivo excede los 10 MB");
      return;
    }

    try {
      // 'result' será el string de la URL que devuelve tu hook 'useUpload'
      const result = await (uploadFileMutation.mutateAsync
        ? uploadFileMutation.mutateAsync(file)
        : new Promise<any>((resolve, reject) =>
            uploadFileMutation.mutate(file, {
              onSuccess: (r: any) => resolve(r),
              onError: (err: any) => reject(err),
            })
          ));

      // ---
      // ¡LA CORRECCIÓN!
      // 'result' es el string de la URL, no el objeto de respuesta.
      const url = result as string;
      // ---

      if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) {
        // Esta es la línea 277. Añadimos más validaciones.
        console.error("El resultado de la subida no fue un string de URL válido:", result);
        throw new Error("No se obtuvo URL tras subir");
      }

      // Manejo según el destino (tu lógica está bien)
      if (fieldName === "video") {
        setValue("video", url);
      } else if (fieldName.startsWith("fotos")) {
        const currentFotos = getValues("fotos") ?? [];
        setValue("fotos", [...currentFotos, url]);
      } else if (fieldName.startsWith("variantes")) {
        const match = fieldName.match(/variantes\.(\d+)\.foto/);
        if (match) {
          const idx = Number(match[1]);
          setValue(`variantes.${idx}.foto` as const, url);
        }
      }

      // No mostramos otro toast de éxito, porque 'useUpload' ya lo hace
      // toast.success("URL de imagen guardada en el formulario.");

    } catch (error: any) {
      // Esta es la línea 301
      console.error("Upload error:", error);
      toast.error(error?.message || "Error al subir archivo");
    }
  };
  /* ===========================
     Submit
     =========================== */
  const onSubmit = async (data: ProductFormValues) => {
    // 🛑 VALIDACIÓN EN EL FRONT-END: Asegurar que haya variantes y stock
    if (data.variantes.length === 0) {
      toast.error("Debes generar al menos una variante.");
      return;
    }
    const hasZeroStock = data.variantes.some(v => v.stock === 0 || v.stock === null || v.stock === undefined);
    if (hasZeroStock) {
        toast.warning("Por favor, revisa el Stock. Debe ser mayor a cero para la Matriz.");
        return;
    }
    // Fin de validación

    try {
      // La mutación (useCreateProduct) llama al ProductService.create, 
      // el cual se encarga de la ASIGNACIÓN AUTOMÁTICA DE INVENTARIO A LA MATRIZ.
      if (createProductMutation.mutateAsync) {
        await createProductMutation.mutateAsync(data as CreateProductPayload);
      } else {
        await new Promise<void>((resolve, reject) => {
          createProductMutation.mutate(data as CreateProductPayload, {
            onSuccess: () => resolve(),
            onError: (err: any) => reject(err),
          });
        });
      }

      toast.success("Producto creado correctamente. Stock asignado a la Matriz.");
      reset(); // limpiar form
      router.push("/productos");
    } catch (error: any) {
      console.error("create error", error);
      toast.error(error?.response?.data?.message || error?.message || "Error al crear el producto");
    }
  };

  /* ===========================
     Render
     =========================== */

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* --- SECCIÓN 1: DATOS DEL PRODUCTO, PRECIOS Y MULTIMEDIA --- */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-6">
          Datos del Producto, Precios y Multimedia
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Columna Izquierda: Datos Básicos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Información Básica</h3>
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" {...register("nombre")} />
              {errors.nombre && (
                <p className="text-xs text-destructive mt-1">
                  {errors.nombre.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" {...register("descripcion")} />
            </div>

            <div>
              <Label htmlFor="categoria_id">Categoría *</Label>
              <Select
                onValueChange={(value: string) =>
                  setValue("categoria_id", value, { shouldValidate: true }) // Añadir validación
                }
                value={watch("categoria_id")}
              >
                <SelectTrigger id="categoria_id">
                  <SelectValue placeholder="Selecciona una categoría..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories ? (
                    <SelectItem value="loading" disabled>
                      Cargando...
                    </SelectItem>
                  ) : (
                    categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.categoria_id && (
                <p className="text-xs text-destructive mt-1">
                  {errors.categoria_id.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" {...register("modelo")} />
            </div>

            <div>
              <Label htmlFor="precioPorPieza">Precio por Pieza (Menudeo)</Label>
              <Input
                id="precioPorPieza"
                type="number"
                step="0.01"
                {...register("precioPorPieza", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug (URL amigable)</Label>
              <Input id="slug" {...register("slug")} />
              <p className="text-xs text-gray-500 mt-1">
                Ej: playera-brush-manga-corta (Recomendado para el SKU)
              </p>
            </div>
          </div>
          {/* Columna Derecha: Precios por Volumen Y MULTIMEDIA */}
          <div className="space-y-6">
            {/* Sub-sección Precios por Volumen */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Precios por Volumen (Mayoreo)
              </h3>
              {volumeFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-end gap-2 p-2 border rounded"
                >
                  <div className="flex-1">
                    <Label htmlFor={`vol-min-${index}`}>Cantidad Mínima</Label>
                    <Input
                      id={`vol-min-${index}`}
                      type="number"
                      {...register(
                        `preciosPorVolumen.${index}.cantidad_minima`,
                        { valueAsNumber: true }
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`vol-precio-${index}`}>
                      Precio Unitario
                    </Label>
                    <Input
                      id={`vol-precio-${index}`}
                      type="number"
                      step="0.01"
                      {...register(`preciosPorVolumen.${index}.precio`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeVolume(index)}
                    className="mb-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => appendVolume({ cantidad_minima: 0, precio: 0 })}
              >
                + Añadir Precio por Volumen
              </Button>
            </div>

            {/* Sub-sección Archivos Multimedia */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium">
                Archivos Multimedia del Producto Principal
              </h3>
              {/* Controles de multimedia... (Mantenidos) */}
              <div>
                <Label htmlFor="video-upload">Video (Opcional, max 10MB)</Label>
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/mp4"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleFileUpload(e, "video")
                  }
                />
                {getValues("video") && (
                  <p className="text-xs mt-1">
                    Video subido: {getValues("video")}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="photo-upload">
                  Fotos Genéricas (Opcional, max 10MB c/u)
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleFileUpload(e, `fotos.0`)
                  }
                />
               {/* Miniaturas */}
                <div className="flex gap-2 mt-2">
                  {(getValues("fotos") ?? []).map((f: string, i: number) => {
                    
                    // --- ¡AÑADE ESTA LÓGICA! ---
                    const photoUrl = (f && !f.startsWith('http'))
                      ? `${SERVER_URL}${f}` // Ej: http://localhost:3000/uploads/foto.png
                      : f; // Es un placeholder o ya es una URL completa
                    // -------------------------

                    return (
                      <div
                        key={i}
                        className="w-16 h-16 border rounded overflow-hidden"
                      >
                        <img
                          src={photoUrl} // <-- ¡USA LA VARIABLE CORREGIDA!
                          alt={`foto-${i}`}
                          className="w-full h-full object-cover"
                          // (Opcional) un fallback por si acaso
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64'; }}
                        />
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 2: OPCIONES Y VARIANTES (Stock y SKU) --- */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Opciones y Variantes</h2>
        <p className="text-sm text-gray-600 mb-6">
          Define opciones, genera combinaciones y **asigna Stock inicial** (para la Matriz).
        </p>
        
        {/* Mensaje de error si no hay variantes (Validación Zod) */}
        {errors.variantes && (
            <div className="p-2 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                {errors.variantes.message}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Columna Izquierda: Gestión de Opciones (Mantenido) */}
          <div className="space-y-6 border-r md:pr-8">
            <h3 className="text-lg font-medium">
              Añadir Opciones De Variantes
            </h3>

            {/* Renderizado de opcionesEditables (Mantenido) */}
            {Object.entries(opcionesEditables).map(([optionName, values]) => (
              <div key={optionName}>
                <Label className="font-semibold">{optionName}</Label>
                <div className="flex flex-wrap gap-2 mt-2 items-center">
                  {values.map((value) => (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="cursor-pointer group relative pr-6"
                      onDoubleClick={() => removeOptionValue(optionName, value)}
                      title={`Doble click para eliminar "${value}"`}
                    >
                      {value}
                      <button
                        type="button"
                        onClick={() => removeOptionValue(optionName, value)}
                        className="absolute top-1/2 right-1 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Eliminar ${value}`}
                      >
                        <X
                          size={12}
                          className="text-muted-foreground hover:text-destructive"
                        />
                      </button>
                    </Badge>
                  ))}

                  {/* Modal de añadir valor (Mantenido) */}
                  <Dialog
                    open={modalOpen && opcionParaAnadirValor === optionName}
                    onOpenChange={setModalOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full h-7 w-7 p-0"
                        onClick={() => openAddValueModal(optionName)}
                      >
                        +
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                       {/* Contenido del modal (Mantenido) */}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}

            {/* Botón generar variantes */}
            <Button
              type="button"
              variant="default"
              onClick={handleGenerateVariants}
              className="w-full mt-6"
            >
              {variantFields.length > 0
                ? "Actualizar Variantes Generadas"
                : "Generar Variantes"}
            </Button>
          </div>

          {/* Columna Derecha: Variantes Generadas (Ajuste en Stock) */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Variantes Generadas ({variantFields.length})
            </h3>
            {variantFields.length === 0 && (
              <p className="text-sm text-gray-500">
                Define opciones y haz clic en "Generar Variantes" para ver las
                combinaciones aquí.
              </p>
            )}
           {/* Columna Derecha: Variantes Generadas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Variantes Generadas ({variantFields.length})
            </h3>
            {variantFields.length === 0 && (
              <p className="text-sm text-gray-500">
                Define opciones y haz clic en "Generar Variantes" para ver las
                combinaciones aquí.
              </p>
            )}
            
            {/* --- INICIO DEL MAP --- */}
            {variantFields.map((field, index) => {
              
              // 1. Obtenemos la URL de la foto de esta variante usando 'watch'
              const variantPhotoPath = watch(`variantes.${index}.foto`); 
              
              // 2. Construimos la URL completa para la imagen
              const variantPhotoUrl = (variantPhotoPath && !variantPhotoPath.startsWith('http'))
                ? `${SERVER_URL}${variantPhotoPath}` // Asume que SERVER_URL está definido antes
                : variantPhotoPath; // Es null o ya es una URL (placeholder)

              return ( 
                <div key={field.id} className="p-3 border rounded space-y-3">
                  <p className="font-semibold text-sm">
                    {nombreProducto}:{" "}
                    {Object.entries(field.opciones ?? {})
                      .map(([key, value]) => value)
                      .join(" / ")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`var-sku-${index}`} className="text-xs">
                        SKU
                      </Label>
                      <Input
                        id={`var-sku-${index}`}
                        placeholder="SKU"
                        {...register(`variantes.${index}.sku` as const)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`var-stock-${index}`} className="text-xs">
                        Stock Inicial *
                      </Label>
                      <Input
                        id={`var-stock-${index}`}
                        type="number"
                        placeholder="1"
                        {...register(`variantes.${index}.stock` as const, {
                          valueAsNumber: true,
                        })}
                        className={`h-8 text-sm ${errors.variantes?.[index]?.stock ? 'border-destructive' : ''}`}
                      />
                      {errors.variantes?.[index]?.stock && (
                          <p className="text-xs text-destructive mt-1">
                            Stock mayor a 0 requerido
                          </p>
                      )}
                    </div>
                    
                    {/* --- Campo de Foto Variante (con miniatura añadida) --- */}
                    <div className="space-y-1"> {/* Agrupamos input y miniatura */}
                      <Label htmlFor={`var-foto-${index}`} className="text-xs">
                        Foto (Opcional)
                      </Label>
                      <Input
                        id={`var-foto-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileUpload(
                            e,
                            `variantes.${index}.foto` as `variantes.${number}.foto`
                          )
                        }
                        className="h-8 text-xs file:mr-2 file:py-1 file:px-2 file:text-xs file:font-semibold"
                      />
                      
                      {/* 3. Añadimos la miniatura CONDICIONALMENTE */}
                      {variantPhotoUrl && (
                        <div className="mt-1 w-10 h-10 border rounded overflow-hidden">
                          <img
                            src={variantPhotoUrl} // <-- Usamos la URL construida
                            alt={`Variante ${index}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40'; }} // Fallback
                          />
                        </div>
                      )}
                      {/* --- FIN DEL CAMBIO --- */}
                    </div>
                  </div>
                </div>
              );
            })} 
            {/* --- FIN DEL MAP --- */}
          </div>
          </div>
        </div>
      </div>

      {/* --- SUBMIT --- */}
      <div className="flex justify-end mt-8">
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            (createProductMutation.isPending ?? false) ||
            (uploadFileMutation.isPending ?? false)
          }
        >
          {isSubmitting ||
          (createProductMutation.isPending ?? false) ||
          (uploadFileMutation.isPending ?? false)
            ? "Guardando y Asignando Stock..." // Mensaje más descriptivo
            : "Guardar Producto"}
        </Button>
      </div>
    </form>
  );
}

export default ProductCreateForm;