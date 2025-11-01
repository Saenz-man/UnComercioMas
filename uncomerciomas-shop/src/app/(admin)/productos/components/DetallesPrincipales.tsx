"use client";

import React, { useState } from "react";
import {
  Control,
  UseFormRegister,
  FieldErrors,
  UseFieldArrayReturn,
  FieldArrayWithId,
  UseFormSetValue,
  UseFormWatch,
  Controller,
} from "react-hook-form";

import { ProductFormValues } from "./ProductForm";
import type { Category } from "@/types/category.types";
import type { CategoryPayload } from "@/services/category.service";

import { useCreateCategory } from "@/hooks/useCategories";
import { useModels } from "@/hooks/useModels"; // ✅ trae los modelos desde productos

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type PreciosVolumenArray = UseFieldArrayReturn<
  ProductFormValues,
  "preciosPorVolumen",
  "id"
>;

interface DetallesPrincipalesProps {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  categories: Category[];
  isLoadingCategories: boolean;
  precioFields: FieldArrayWithId<ProductFormValues, "preciosPorVolumen", "id">[];
  appendPrecio: PreciosVolumenArray["append"];
  removePrecio: PreciosVolumenArray["remove"];
}

// Helper slugify
const slugify = (text: string): string =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");

export function DetallesPrincipales({
  control,
  register,
  setValue,
  errors,
  categories,
  isLoadingCategories,
  precioFields,
  appendPrecio,
  removePrecio,
}: DetallesPrincipalesProps) {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newModelName, setNewModelName] = useState("");

  const createCategoryMutation = useCreateCategory();
  const { data: models = [], isLoading: isLoadingModels } = useModels();

  // Crear colección
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const payload: CategoryPayload = {
      nombre: newCategoryName,
      slug: slugify(newCategoryName),
    };
    createCategoryMutation.mutate(payload, {
      onSuccess: (newCategory) => {
        setValue("categoria_id", newCategory.id, { shouldDirty: true });
        toast.success("Colección creada con éxito");
        setNewCategoryName("");
        setIsCategoryDialogOpen(false);
      },
    });
  };

  // Crear modelo
  const handleCreateModel = () => {
    if (!newModelName.trim()) return;
    setValue("modelo", newModelName.trim(), { shouldDirty: true });
    toast.success(`Modelo "${newModelName}" agregado`);
    setNewModelName("");
    setIsModelDialogOpen(false);
  };

  return (
    <div className="p-6 border rounded-lg shadow-sm space-y-6 bg-white">
      <h2 className="text-xl font-semibold">Detalles Principales</h2>

      {/* Nombre */}
      <div>
        <Label htmlFor="nombre">Nombre del producto</Label>
        <Input id="nombre" {...register("nombre")} />
        {errors.nombre && (
          <p className="text-sm text-destructive mt-1">
            {errors.nombre.message}
          </p>
        )}
      </div>

      {/* Colección y Modelo juntos */}
      <div className="grid grid-cols-2 gap-4">
        {/* Colección */}
        <div>
          <Label htmlFor="categoria_id">Colección</Label>
          <Controller
            name="categoria_id"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={(value) => {
                  if (value === "crear_nueva_categoria")
                    setIsCategoryDialogOpen(true);
                  else field.onChange(value);
                }}
                disabled={isLoadingCategories}
              >
                <SelectTrigger id="categoria_id">
                  <SelectValue placeholder="Selecciona una colección..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories ? (
                    <SelectItem value="loading" disabled>
                      Cargando...
                    </SelectItem>
                  ) : (
                    <>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="crear_nueva_categoria"
                        className="text-blue-600 font-medium"
                      >
                        + Crear nueva colección
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Modelo */}
        <div>
          <Label htmlFor="modelo">Modelo</Label>
          <Controller
            name="modelo"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={(value) => {
                  if (value === "crear_nuevo_modelo")
                    setIsModelDialogOpen(true);
                  else field.onChange(value);
                }}
                disabled={isLoadingModels}
              >
                <SelectTrigger id="modelo">
                  <SelectValue placeholder="Selecciona o crea un modelo..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingModels ? (
                    <SelectItem value="loading" disabled>
                      Cargando...
                    </SelectItem>
                  ) : (
                    <>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.nombre}>
                          {m.nombre}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="crear_nuevo_modelo"
                        className="text-blue-600 font-medium"
                      >
                        + Crear nuevo modelo
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" {...register("descripcion")} />
      </div>

      {/* Slug */}
      <div>
        <Label htmlFor="slug">Slug (URL)</Label>
        <Input id="slug" {...register("slug")} />
        {errors.slug && (
          <p className="text-sm text-destructive mt-1">
            {errors.slug.message}
          </p>
        )}
      </div>

      {/* Precio */}
      <div className="pt-6 border-t space-y-4">
        <h3 className="text-lg font-medium">Precios</h3>

        <div>
          <Label htmlFor="precioPorPieza">Precio por pieza</Label>
          <Input
            id="precioPorPieza"
            type="number"
            step="0.01"
            {...register("precioPorPieza", { valueAsNumber: true })}
          />
          {errors.precioPorPieza && (
            <p className="text-sm text-destructive mt-1">
              {errors.precioPorPieza.message}
            </p>
          )}
        </div>

        <div>
          <h4 className="text-md font-medium">Precios por mayoreo</h4>
          <div className="space-y-3">
            {precioFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <Label className="text-xs">Cantidad mínima</Label>
                  <Input
                    type="number"
                    {...register(
                      `preciosPorVolumen.${index}.cantidad_minima`,
                      { valueAsNumber: true }
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="grow">
                    <Label className="text-xs">Precio por mayoreo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`preciosPorVolumen.${index}.precio`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrecio(index)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendPrecio({ cantidad_minima: 0, precio: 0 })
            }
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Añadir nivel
          </Button>
        </div>
      </div>

      {/* --- Diálogo Crear Colección --- */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva colección</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nombre de la colección"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory} disabled={createCategoryMutation.isPending}>
              {createCategoryMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Diálogo Crear Modelo --- */}
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo modelo</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nombre del modelo"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModelDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateModel}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
