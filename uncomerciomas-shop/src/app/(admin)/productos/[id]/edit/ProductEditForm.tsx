"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Product, CreateProductPayload } from "@/types/product.types"; // Tus tipos
import { useUpdateProduct } from "@/hooks/useProducts"; // Tu hook de update
import { useUpload } from "@/hooks/useUpload"; // Hook para subir imágenes
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
import {
  Loader2,
  Trash2,
  PlusCircle,
  AlertCircle,
  X,
  ImagePlus,
  ImageOff,
} from "lucide-react"; // Añadidos iconos
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Asegúrate de importar toast

// Opcional: Para el Select de Categoría
// import { useCategories } from '@/hooks/useCategories';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductEditFormProps {
  product: Product;
}

// Helper Cartesiano
const cartesian = <T,>(...a: T[][]): T[][] =>
  a.reduce<T[][]>(
    (acc, val) => acc.flatMap((d) => val.map((e) => [...d, e])),
    [[]]
  );

export function ProductEditForm({ product }: ProductEditFormProps) {
  const router = useRouter();
  const updateMutation = useUpdateProduct();
  const uploadMutation = useUpload();
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL; // Para mostrar imágenes

  // Mapeo de Product a defaultValues
  const defaultValues: CreateProductPayload = {
    nombre: product.nombre,
    modelo: product.modelo ?? null,
    slug: product.slug,
    descripcion: product.descripcion ?? null,
    // Convierte precio a número
    precioPorPieza:
      typeof product.precioPorPieza === "string"
        ? parseFloat(product.precioPorPieza)
        : product.precioPorPieza || 0,
    categoria_id: product.categoria.id, // Asume que categoria siempre existe
    fotos: product.fotos ?? [],
    video: product.video ?? null,
    opciones: product.opciones ?? {},
    preciosPorVolumen:
      product.preciosPorVolumen?.map((p) => ({
        cantidad_minima: p.cantidad_minima,
        // Convierte precio a número
        precio:
          typeof p.precio === "string" ? parseFloat(p.precio) : p.precio || 0,
      })) ?? [],
    variantes:
      product.variantes?.map((v) => ({
        sku: v.sku,
        stock: v.stock,
        foto: v.foto_variante ?? null, // Usa el nombre correcto de tu entidad/API
        opciones: v.atributos,
        precio:
          typeof (v as any).precio === "string"
            ? parseFloat((v as any).precio)
            : (v as any).precio,
      })) ?? [],
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<CreateProductPayload>({ defaultValues });

  // Estados locales para opciones
  const [opcionesEditables, setOpcionesEditables] = useState<
    Record<string, string[]>
  >(defaultValues.opciones);
  const [modalOpen, setModalOpen] = useState(false);
  const [opcionParaAnadirValor, setOpcionParaAnadirValor] = useState<
    string | null
  >(null);
  const [nuevoValor, setNuevoValor] = useState("");
  const nombreProducto = watch("nombre");

  // Field Arrays
  const { fields: variantFields, replace } = useFieldArray({
    control,
    name: "variantes",
  });
  const {
    fields: precioFields,
    append: appendPrecio,
    remove: removePrecio,
  } = useFieldArray({ control, name: "preciosPorVolumen" });

  // useEffect para resetear
  useEffect(() => {
    reset(defaultValues);
    setOpcionesEditables(defaultValues.opciones);
  }, [product, reset]);

  // Handlers para opciones
  const openAddValueModal = (optionName: string) => {
    setOpcionParaAnadirValor(optionName);
    setModalOpen(true);
    setNuevoValor("");
  };

  const addOptionValue = (optionName: string, value: string) => {
    if (!value || !optionName) return;
    const newValues = [...(opcionesEditables[optionName] || []), value];
    const newOpciones = { ...opcionesEditables, [optionName]: newValues };
    setOpcionesEditables(newOpciones);
    setValue("opciones", newOpciones, { shouldDirty: true });
    setModalOpen(false);
  };

  const removeOptionValue = (optionName: string, valueToRemove: string) => {
    const newValues = (opcionesEditables[optionName] || []).filter(
      (v) => v !== valueToRemove
    );
    const newOpciones = { ...opcionesEditables, [optionName]: newValues };
    setOpcionesEditables(newOpciones);
    setValue("opciones", newOpciones, { shouldDirty: true });
  };

  const handleGenerateVariants = () => {
    const options = Object.values(opcionesEditables);
    const optionKeys = Object.keys(opcionesEditables);
    const precioPadre = getValues("precioPorPieza");

    if (options.length === 0 || options.some((o) => o.length === 0)) {
      replace([]);
      return;
    }
    const combinations = cartesian(...options);
    const newVariants: CreateProductPayload["variantes"] = combinations.map(
      (combo) => {
        const opciones: Record<string, string> = {};
        combo.forEach((value, index) => {
          opciones[optionKeys[index]] = value;
        });
        const skuName = combo.join("-").toUpperCase().replace(/\s/g, "_");
        const existingVariant = (getValues("variantes") || []).find((v) => {
          if (!v.opciones) return false;
          return JSON.stringify(v.opciones) === JSON.stringify(opciones);
        });
        return {
          sku:
            existingVariant?.sku || `${product.slug.toUpperCase()}-${skuName}`,
          stock: existingVariant?.stock || 0,
          foto: existingVariant?.foto || null,
          opciones: opciones,
          precio: existingVariant?.precio || precioPadre,
        };
      }
    );
    replace(newVariants);
  };

  // --- HandleFileUpload ACTUALIZADO para Padre e Hijos ---
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "fotos" | `variantes.${number}.foto` | "video"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      toast.error("El archivo excede los 10 MB");
      return;
    }

    try {
      const result = await (uploadMutation.mutateAsync
        ? uploadMutation.mutateAsync(file)
        : new Promise<any>((resolve, reject) =>
            uploadMutation.mutate(file, {
              onSuccess: (r: any) => resolve(r),
              onError: (err: any) => reject(err),
            })
          ));

      const url = result as string; // Asume que el hook devuelve la URL

      if (!url || typeof url !== "string" || !url.startsWith("/uploads/")) {
        console.error("Resultado de subida inválido:", result);
        throw new Error("No se obtuvo una URL válida tras subir");
      }

      // Lógica diferenciada para Padre vs Hijo
      if (fieldName === "fotos") {
        const currentFotos = getValues("fotos") ?? [];
        setValue("fotos", [...currentFotos, url], { shouldDirty: true });
        toast.success("Foto principal añadida.");
      } else if (fieldName === "video") {
        setValue("video", url, { shouldDirty: true });
        toast.success("Video añadido.");
      } else if (fieldName.startsWith("variantes")) {
        const match = fieldName.match(/variantes\.(\d+)\.foto/);
        if (match) {
          const idx = Number(match[1]);
          setValue(`variantes.${idx}.foto` as const, url, {
            shouldDirty: true,
          });
          toast.success(`Foto añadida a la variante ${idx + 1}.`);
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error?.message || "Error al subir archivo");
    } finally {
      e.target.value = ""; // Limpia el input
    }
  };

  // --- Función para quitar foto principal ---
  const removeMainPhoto = (indexToRemove: number) => {
    const currentFotos = getValues("fotos") ?? [];
    setValue(
      "fotos",
      currentFotos.filter((_, index) => index !== indexToRemove),
      { shouldDirty: true }
    );
    toast.info("Foto principal eliminada.");
  };

  // --- Función de Envío ---
  const onSubmit = (formData: CreateProductPayload) => {
    console.log("Datos a enviar (actualización):", formData);
    updateMutation.mutate(
      { productId: product.id, updateData: formData },
      {
        onSuccess: () => {
          toast.success("Producto actualizado con éxito.");
          router.push("/productos"); // Vuelve a la lista
        },
        onError: (error: any) => {
          // El toast de error ya se maneja con el 'isError' abajo
          console.error("Error al actualizar:", error);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* --- SECCIÓN: DETALLES PRINCIPALES (Nombre, Slug, Precio, Desc) --- */}
      <div className="p-6 border rounded-lg space-y-4 shadow-sm">
        <h2 className="text-xl font-semibold">Detalles Principales</h2>

        {/* Nombre */}
        <div>
          <Label htmlFor="nombre">Nombre del Producto</Label>
          <Input
            id="nombre"
            {...register("nombre", { required: "El nombre es obligatorio" })}
          />
          {errors.nombre && (
            <p className="text-sm text-destructive mt-1">
              {errors.nombre.message}
            </p>
          )}
        </div>

        {/* Grid Precio y Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="precioPorPieza">
              Precio por Pieza (Ej: 150.50)
            </Label>
            <Input
              id="precioPorPieza"
              type="number"
              step="0.01"
              {...register("precioPorPieza", {
                required: "Precio es obligatorio",
                valueAsNumber: true,
                validate: (value) => value > 0 || "Precio debe ser mayor a 0",
              })}
            />
            {errors.precioPorPieza && (
              <p className="text-sm text-destructive mt-1">
                {errors.precioPorPieza.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              {...register("slug", { required: "El slug es obligatorio" })}
            />
            {errors.slug && (
              <p className="text-sm text-destructive mt-1">
                {errors.slug.message}
              </p>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" {...register("descripcion")} />
        </div>

        {/* (Aquí iría el Select de Categoría si lo necesitas editar) */}
      </div>

      {/* --- SECCIÓN MULTIMEDIA PADRE --- */}
      <div className="p-6 border rounded-lg space-y-4 shadow-sm">
        <h2 className="text-xl font-semibold">Multimedia Principal</h2>
        {/* Input para añadir FOTOS principales */}
        <div>
          <Label htmlFor="main-photo-upload">
            Añadir Foto Principal (Max 10MB)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="main-photo-upload"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "fotos")}
              className="flex-grow"
              disabled={uploadMutation.isPending}
            />
            {uploadMutation.isPending && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
        {/* Miniaturas de FOTOS principales */}
        <div>
          <Label>Fotos Actuales:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(watch("fotos") ?? []).map((fotoUrl, index) => {
              const fullUrl =
                fotoUrl && !fotoUrl.startsWith("http")
                  ? `${SERVER_URL}${fotoUrl}`
                  : fotoUrl;
              return (
                <div
                  key={index}
                  className="relative group w-20 h-20 border rounded overflow-hidden"
                >
                  <img
                    src={fullUrl || ''}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeMainPhoto(index)}
                    className="absolute top-0 right-0 p-0.5 bg-destructive/80 text-destructive-foreground rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar foto"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
            {(!watch("fotos") || watch("fotos")?.length === 0) && (
              <div className="w-20 h-20 border rounded flex items-center justify-center bg-muted/50 text-muted-foreground">
                <ImageOff size={24} />
              </div>
            )}
          </div>
        </div>
        {/* (Aquí podrías añadir el input para el VIDEO si necesitas editarlo) */}
      </div>

      {/* --- SECCIÓN PRECIOS POR VOLUMEN --- */}
      <div className="p-6 border rounded-lg space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Precios por Volumen</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendPrecio({ cantidad_minima: 0, precio: 0 })}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Añadir Nivel
          </Button>
        </div>
        {precioFields.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No hay precios por volumen definidos.
          </p>
        )}
        {precioFields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-end gap-2 p-3 border rounded bg-muted/30"
          >
            <div className="flex-1">
              <Label htmlFor={`vol-min-${index}`} className="text-xs">
                Cantidad Mínima
              </Label>
              <Input
                id={`vol-min-${index}`}
                type="number"
                placeholder="Ej: 10"
                {...register(`preciosPorVolumen.${index}.cantidad_minima`, {
                  valueAsNumber: true,
                  min: { value: 1, message: "Mínimo 1" },
                })}
                className="h-9"
              />
              {errors.preciosPorVolumen?.[index]?.cantidad_minima && (
                <p className="text-xs text-destructive mt-1">
                  {errors.preciosPorVolumen[index]?.cantidad_minima?.message}
                </p>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor={`vol-precio-${index}`} className="text-xs">
                Precio Unitario
              </Label>
              <Input
                id={`vol-precio-${index}`}
                type="number"
                step="0.01"
                placeholder="Ej: 80.00"
                {...register(`preciosPorVolumen.${index}.precio`, {
                  valueAsNumber: true,
                  min: { value: 0.01, message: "> 0" },
                })}
                className="h-9"
              />
              {errors.preciosPorVolumen?.[index]?.precio && (
                <p className="text-xs text-destructive mt-1">
                  {errors.preciosPorVolumen[index]?.precio?.message}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removePrecio(index)}
              className="mb-1 text-destructive hover:bg-destructive/10"
              title="Eliminar nivel"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* --- SECCIÓN OPCIONES Y VARIANTES --- */}
      <div className="p-4 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Opciones y Variantes</h2>
        <p className="text-sm text-gray-600 mb-6">
          Define opciones, genera combinaciones y asigna Stock inicial.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Columna Izquierda: Opciones */}
          <div className="space-y-6 border-r md:pr-8">
            <h3 className="text-lg font-medium">
              Añadir Opciones De Variantes
            </h3>
            {Object.entries(opcionesEditables).map(([optionName, values]) => (
              <div key={optionName}>
                {" "}
                <Label className="font-semibold">{optionName}</Label>{" "}
                <div className="flex flex-wrap gap-2 mt-2 items-center">
                  {" "}
                  {values.map((value) => (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="cursor-pointer group relative pr-6"
                      onDoubleClick={() => removeOptionValue(optionName, value)}
                      title={`Doble click para eliminar "${value}"`}
                    >
                      {" "}
                      {value}{" "}
                      <button
                        type="button"
                        onClick={() => removeOptionValue(optionName, value)}
                        className="absolute top-1/2 right-1 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Eliminar ${value}`}
                      >
                        {" "}
                        <X
                          size={12}
                          className="text-muted-foreground hover:text-destructive"
                        />{" "}
                      </button>{" "}
                    </Badge>
                  ))}{" "}
                  <Dialog
                    open={modalOpen && opcionParaAnadirValor === optionName}
                    onOpenChange={setModalOpen}
                  >
                    {" "}
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full h-7 w-7 p-0"
                        onClick={() => openAddValueModal(optionName)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>{" "}
                    <DialogContent className="sm:max-w-[425px]">
                      {" "}
                      <DialogHeader>
                        <DialogTitle>
                          Agregar Nuevo Valor a "{opcionParaAnadirValor}"
                        </DialogTitle>
                      </DialogHeader>{" "}
                      <div className="grid gap-4 py-4">
                        {" "}
                        <div className="grid grid-cols-4 items-center gap-4">
                          {" "}
                          <Label htmlFor="new-value" className="text-right">
                            Valor
                          </Label>{" "}
                          <Input
                            id="new-value"
                            value={nuevoValor}
                            onChange={(e) => setNuevoValor(e.target.value)}
                            className="col-span-3"
                            placeholder="Ej: Rojo"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addOptionValue(
                                  opcionParaAnadirValor!,
                                  nuevoValor
                                );
                              }
                            }}
                          />{" "}
                        </div>{" "}
                      </div>{" "}
                      <DialogFooter>
                        {" "}
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancelar
                          </Button>
                        </DialogClose>{" "}
                        <Button
                          type="button"
                          onClick={() =>
                            addOptionValue(opcionParaAnadirValor!, nuevoValor)
                          }
                        >
                          Guardar Valor
                        </Button>{" "}
                      </DialogFooter>{" "}
                    </DialogContent>{" "}
                  </Dialog>{" "}
                </div>{" "}
              </div>
            ))}
            <Button
              type="button"
              variant="default"
              onClick={handleGenerateVariants}
              className="w-full mt-6"
              disabled={Object.keys(opcionesEditables).length === 0}
            >
              {variantFields.length > 0
                ? "Actualizar Variantes Generadas"
                : "Generar Variantes"}
            </Button>
          </div>
          {/* Columna Derecha: Variantes */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            <h3 className="text-lg font-medium">
              Variantes Generadas ({variantFields.length})
            </h3>
            {variantFields.length === 0 && (
              <p className="text-sm text-gray-500">
                Define opciones y haz clic en "Generar Variantes".
              </p>
            )}
            {variantFields.map((field, index) => {
              const variantPhotoPath = watch(`variantes.${index}.foto`);
              const variantPhotoUrl =
                variantPhotoPath && !variantPhotoPath.startsWith("http")
                  ? `${SERVER_URL}${variantPhotoPath}`
                  : variantPhotoPath;
              return (
                <div key={field.id} className="p-3 border rounded space-y-3">
                  {" "}
                  <p className="font-semibold text-sm">
                    {nombreProducto}:{" "}
                    {Object.entries(field.opciones ?? {})
                      .map(([key, value]) => value)
                      .join(" / ")}
                  </p>{" "}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {" "}
                    <div>
                      {" "}
                      <Label htmlFor={`var-sku-${index}`} className="text-xs">
                        SKU
                      </Label>{" "}
                      <Input
                        id={`var-sku-${index}`}
                        placeholder="SKU"
                        {...register(`variantes.${index}.sku` as const)}
                        className="h-8 text-sm"
                      />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <Label htmlFor={`var-stock-${index}`} className="text-xs">
                        Stock
                      </Label>{" "}
                      <Input
                        id={`var-stock-${index}`}
                        type="number"
                        placeholder="0"
                        {...register(`variantes.${index}.stock` as const, {
                          valueAsNumber: true,
                        })}
                        className="h-8 text-sm"
                      />{" "}
                    </div>{" "}
                    <div className="space-y-1">
                      {" "}
                      <Label htmlFor={`var-foto-${index}`} className="text-xs">
                        Foto (Opcional)
                      </Label>{" "}
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
                        disabled={uploadMutation.isPending}
                      />{" "}
                      {variantPhotoUrl && (
                        <div className="mt-1 w-10 h-10 border rounded overflow-hidden">
                          {" "}
                          <img
                            src={variantPhotoUrl }
                            alt={`Variante ${index}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/40x40";
                            }}
                          />{" "}
                        </div>
                      )}{" "}
                    </div>{" "}
                  </div>{" "}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- SECCIÓN: ACCIONES --- */}
      {updateMutation.isError && (
        <div className="flex items-center gap-2 p-3 text-destructive border border-destructive/50 bg-destructive/10 rounded-lg">
          {" "}
          <AlertCircle className="h-4 w-4" />{" "}
          <span>
            {" "}
            <b>Error: </b>{" "}
            {(() => {
              const error = updateMutation.error as any;
              if (error.response?.data?.message) {
                if (Array.isArray(error.response.data.message)) {
                  return error.response.data.message.join(", ");
                }
                return error.response.data.message;
              }
              return error.message || "No se pudo actualizar";
            })()}{" "}
          </span>{" "}
        </div>
      )}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={updateMutation.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
          {" "}
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}{" "}
          Guardar Cambios{" "}
        </Button>
      </div>
    </form>
  );
}

export default ProductEditForm;
