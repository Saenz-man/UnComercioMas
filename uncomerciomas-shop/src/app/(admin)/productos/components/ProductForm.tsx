"use client";

import React, { useEffect, useState } from "react";
import {
  useForm,
  useFieldArray,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useCategories } from "@/hooks/useCategories";
import { useModels } from "@/hooks/useModels";
import { useUpload } from "@/hooks/useUpload";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";

import { DetallesPrincipales } from "./DetallesPrincipales";
import { Multimedia } from "./Multimedia";
import { OpcionesYVariantes } from "./OpcionesYVariantes";

import { Button } from "@/components/ui/button";
import { Product, CreateProductPayload } from "@/types/product.types";
import { CreateProductVariantPayload } from "@/types/product-variant.types";

/* ---------------------------
   🔒 Zod Schemas
--------------------------- */
const variantSchema = z.object({
  sku: z.string().optional(),
  stock: z.number().min(0, "El stock no puede ser negativo"),
  foto: z.string().nullable().optional(),
  opciones: z.record(z.string(), z.string()).default({}), // ✅ ahora nunca es undefined
  precio: z.number().min(0).optional(),
});

const productSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  modelo: z.string().nullable(),
  descripcion: z.string().nullable(),
  precioPorPieza: z.number().gt(0, "El precio debe ser mayor a 0"),
  slug: z.string().min(1, "El slug es obligatorio"),
  categoria_id: z.string().min(1, "Selecciona una categoría"),
  fotos: z.array(z.string().nullable()).default([]),
  video: z.string().nullable().default(null),
  preciosPorVolumen: z
    .array(
      z.object({
        cantidad_minima: z.number().min(0),
        precio: z.number().min(0),
      })
    )
    .default([]),
  opciones: z.record(z.string(), z.array(z.string())).default({}),
  variantes: z.array(variantSchema).default([]),
});

export type ProductFormValues = z.infer<typeof productSchema>;

/* ---------------------------
   🔁 Helpers
--------------------------- */
const mapProductToFormValues = (product: Product): ProductFormValues => ({
  nombre: product.nombre,
  modelo: product.modelo ?? null,
  slug: product.slug,
  descripcion: product.descripcion ?? null,
  precioPorPieza:
    typeof product.precioPorPieza === "string"
      ? parseFloat(product.precioPorPieza)
      : product.precioPorPieza || 0,
  categoria_id: product.categoria.id,
  fotos: product.fotos ?? [],
  video: product.video ?? null,
  opciones: product.opciones ?? {},
  preciosPorVolumen:
    product.preciosPorVolumen?.map((p) => ({
      cantidad_minima: p.cantidad_minima,
      precio:
        typeof p.precio === "string" ? parseFloat(p.precio) : p.precio || 0,
    })) ?? [],
  variantes:
    product.variantes?.map((v) => ({
      sku: v.sku,
      stock: v.stock,
      foto: v.foto_variante ?? null,
      opciones: v.atributos ?? {},
      precio:
        typeof v.precio === "string" ? parseFloat(v.precio) : v.precio || 0,
    })) ?? [],
});

const getCreateDefaults = (): ProductFormValues => ({
  nombre: "",
  modelo: null,
  descripcion: "",
  precioPorPieza: 0,
  slug: "",
  categoria_id: "",
  fotos: [],
  video: null,
  preciosPorVolumen: [],
  opciones: {},
  variantes: [],
});

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

/* ---------------------------
   💡 Componente Principal
--------------------------- */
export function ProductForm({ initialData }: { initialData?: Product }) {
  const router = useRouter();
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;
  const isEditMode = !!initialData;

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const uploadMutation = useUpload();

  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: models } = useModels();

  // --- 💡 CORRECCIÓN AQUÍ ---
  // Añadimos el tipo explícito `: ProductFormValues` a la constante.
  // Esto asegura que TypeScript use el tipo exacto que Zod y useForm esperan.
  const defaultValues: ProductFormValues = isEditMode
    ? mapProductToFormValues(initialData)
    : getCreateDefaults();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema), // <-- Este error (162) se soluciona
    defaultValues,
  });

  const [opcionesEditables, setOpcionesEditables] = useState<
    Record<string, string[]>
  >(defaultValues.opciones || {});
  const [modalOpen, setModalOpen] = useState(false);
  const [opcionParaAnadirValor, setOpcionParaAnadirValor] = useState<string | null>(
    null
  );
  const [nuevoValor, setNuevoValor] = useState("");

  const nombreProducto = watch("nombre");

  const { fields: precioFields, append: appendPrecio, remove: removePrecio } =
    useFieldArray({
      control,
      name: "preciosPorVolumen",
    });

  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control,
    name: "variantes",
  });

  useEffect(() => {
    if (isEditMode && initialData) {
      reset(mapProductToFormValues(initialData));
    }
  }, [initialData, isEditMode, reset]);

  /* ---------------------------
     🧩 Handlers
  --------------------------- */
  const openAddValueModal = (optionName: string) => {
    setOpcionParaAnadirValor(optionName);
    setModalOpen(true);
  };

  const addOptionValue = (optionName: string, value: string) => {
    if (!value.trim()) return;
    const updated = { ...opcionesEditables };
    const current = updated[optionName] || [];
    if (!current.includes(value)) {
      updated[optionName] = [...current, value];
      setOpcionesEditables(updated);
      setValue("opciones", updated);
    }
    setModalOpen(false);
    setNuevoValor("");
  };

  const removeOptionValue = (optionName: string, valueToRemove: string) => {
    const updated = { ...opcionesEditables };
    updated[optionName] = updated[optionName].filter((v) => v !== valueToRemove);
    setOpcionesEditables(updated);
    setValue("opciones", updated);
  };

  const handleGenerateVariants = () => {
    const combinaciones = getVariantCombinations(opcionesEditables);
    const nuevasVariantes = combinaciones.map((combo) => ({
      sku: `${getValues("slug")?.toUpperCase() || "SKU"}-${Object.values(combo).join("-")}`,
      stock: 0,
      foto: null,
      opciones: combo,
      precio: getValues("precioPorPieza"),
    }));
    replaceVariants(nuevasVariantes);
    toast.success(`${nuevasVariantes.length} variantes generadas.`);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: "fotos" | `variantes.${number}.foto` | "video"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const uploadedUrl = await uploadMutation.mutateAsync(file);
      if (!uploadedUrl) {
        toast.error("No se obtuvo la URL del archivo subido.");
        return;
      }

      if (fieldName === "fotos") {
        const currentPhotos = getValues("fotos") || [];
        setValue("fotos", [...currentPhotos, uploadedUrl]);
      } else if (fieldName === "video") {
        setValue("video", uploadedUrl);
      } else if (fieldName.startsWith("variantes.")) {
        setValue(fieldName as any, uploadedUrl);
      }

      toast.success("Archivo subido correctamente ✅");
    } catch (error: any) {
      toast.error(error?.message || "Error al subir archivo");
    } finally {
      event.target.value = "";
    }
  };

  const removeMainPhoto = (index: number) => {
    const current = getValues("fotos") || [];
    const updated = current.filter((_, i) => i !== index);
    setValue("fotos", updated, { shouldDirty: true });
  };

  /* ---------------------------
     🚀 Submit
  --------------------------- */
  const onSubmit = async (data: ProductFormValues) => {
    // <-- Este error (318) se soluciona
    const payload: CreateProductPayload = {
      ...data,
      variantes: data.variantes.map(
        (v): CreateProductVariantPayload => ({
          sku:
            v.sku ||
            `${data.slug?.toUpperCase() || "SKU"}-${Object.values(v.opciones || {}).join("-")}`,
          foto: v.foto ?? null,
          precio: v.precio ?? data.precioPorPieza,
          stock: v.stock,
          opciones: v.opciones ?? {}, // ✅ garantizado
        })
      ),
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          productId: initialData!.id,
          updateData: payload,
        });
        toast.success("Producto actualizado con éxito.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Producto creado con éxito.");
      }
      router.push("/productos");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al guardar producto");
    }
  };

  const isLoading = isSubmitting || createMutation.isPending || updateMutation.isPending;

  /* ---------------------------
     🖼️ Render
  --------------------------- */
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {isEditMode ? "Editar Producto" : "Crear Producto"}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <Multimedia
              watch={watch}
              setValue={setValue}
              handleFileUpload={handleFileUpload}
              isUploading={uploadMutation.isPending}
              SERVER_URL={SERVER_URL}
              removeMainPhoto={removeMainPhoto}
            />
          </div>

          <div className="md:col-span-2 space-y-6">
            <DetallesPrincipales
              register={register}
              control={control} // <-- Este error (334) se soluciona
              errors={errors}
              setValue={setValue}
              watch={watch}
              categories={categories || []}
              isLoadingCategories={isLoadingCategories}
              precioFields={precioFields}
              appendPrecio={appendPrecio}
              removePrecio={removePrecio}
            />

            <OpcionesYVariantes
              control={control} // <-- Este error (346) se soluciona
              register={register}
              watch={watch}
              setValue={setValue}
              getValues={getValues}
              errors={errors}
              opcionesEditables={opcionesEditables}
              setOpcionesEditables={setOpcionesEditables}
              modalOpen={modalOpen}
              setModalOpen={setModalOpen}
              opcionParaAnadirValor={opcionParaAnadirValor}
              setOpcionParaAnadirValor={setOpcionParaAnadirValor}
              nuevoValor={nuevoValor}
              setNuevoValor={setNuevoValor}
              openAddValueModal={openAddValueModal}
              addOptionValue={addOptionValue}
              removeOptionValue={removeOptionValue}
              handleGenerateVariants={handleGenerateVariants}
              handleFileUpload={handleFileUpload}
              variantFields={variantFields}
              isUploading={uploadMutation.isPending}
              SERVER_URL={SERVER_URL}
              nombreProducto={nombreProducto}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Actualizar producto" : "Crear producto"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
