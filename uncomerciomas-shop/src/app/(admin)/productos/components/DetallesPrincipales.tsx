"use client";

import React from "react";
import {
  Control,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
  UseFieldArrayReturn,
} from "react-hook-form";
import { ProductFormValues } from "./ProductForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface DetallesPrincipalesProps {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  categories: { id: string; nombre: string }[];
  isLoadingCategories: boolean;
  precioFields: UseFieldArrayReturn<ProductFormValues, "preciosPorVolumen", "id">["fields"];
  appendPrecio: UseFieldArrayReturn<ProductFormValues, "preciosPorVolumen", "id">["append"];
  removePrecio: UseFieldArrayReturn<ProductFormValues, "preciosPorVolumen", "id">["remove"];
}

export const DetallesPrincipales: React.FC<DetallesPrincipalesProps> = ({
  register,
  control,
  errors,
  setValue,
  watch,
  categories,
  isLoadingCategories,
  precioFields,
  appendPrecio,
  removePrecio,
}) => {
  const precios = watch("preciosPorVolumen");

  return (
    <Card className="shadow-sm border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Detalles principales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nombre y slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nombre del producto</Label>
            <Input
              placeholder="Ej: Playera Brush Manga Corta"
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <Label>Slug</Label>
            <Input
              placeholder="Ej: playera-brush-manga-corta"
              {...register("slug")}
            />
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <Label>Descripción</Label>
          <Textarea
            placeholder="Describe el producto brevemente..."
            {...register("descripcion")}
          />
        </div>

        {/* Precio base y modelo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Precio por pieza</Label>
            <Input
              type="number"
              step="0.01"
              {...register("precioPorPieza", { valueAsNumber: true })}
            />
            {errors.precioPorPieza && (
              <p className="text-red-500 text-sm mt-1">
                {errors.precioPorPieza.message}
              </p>
            )}
          </div>

          <div>
            <Label>Modelo</Label>
            <Input
              placeholder="Ej: Hombre / Mujer / Unisex"
              {...register("modelo")}
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <Label>Categoría</Label>
          {isLoadingCategories ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin w-4 h-4" /> Cargando categorías...
            </div>
          ) : (
            <Select
              onValueChange={(value) => setValue("categoria_id", value)}
              defaultValue={watch("categoria_id")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.categoria_id && (
            <p className="text-red-500 text-sm mt-1">
              {errors.categoria_id.message}
            </p>
          )}
        </div>

        {/* Precios por volumen */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Precios por volumen</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => appendPrecio({ cantidad_minima: 0, precio: 0 })}
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar nivel
            </Button>
          </div>

          <div className="space-y-3">
            {precios.length === 0 && (
              <p className="text-gray-500 text-sm">Sin precios por volumen.</p>
            )}
            {precioFields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-5 items-center gap-3"
              >
                <div className="col-span-2">
                  <Label>Cantidad mínima</Label>
                  <Input
                    type="number"
                    {...register(`preciosPorVolumen.${index}.cantidad_minima`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Precio unitario</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`preciosPorVolumen.${index}.precio`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removePrecio(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
