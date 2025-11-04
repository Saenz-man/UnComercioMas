"use client";

import React from "react";
import {
  Control,
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { ProductFormValues } from "./ProductForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, PlusCircle, Loader2, ImagePlus } from "lucide-react";
import Image from "next/image";

interface OpcionesYVariantesProps {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  getValues: UseFormGetValues<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;

  opcionesEditables: Record<string, string[]>;
  setOpcionesEditables: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  modalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  opcionParaAnadirValor: string | null;
  setOpcionParaAnadirValor: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  nuevoValor: string;
  setNuevoValor: React.Dispatch<React.SetStateAction<string>>;
  openAddValueModal: (optionName: string) => void;
  addOptionValue: (optionName: string, value: string) => void;
  removeOptionValue: (optionName: string, value: string) => void;
  handleGenerateVariants: () => void;
  handleFileUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: "fotos" | "video" | `variantes.${number}.foto`
  ) => Promise<void>;
  variantFields: { id: string }[];
  isUploading: boolean;
  SERVER_URL?: string;
  nombreProducto: string;
}

export const OpcionesYVariantes: React.FC<OpcionesYVariantesProps> = ({
  control,
  register,
  watch,
  setValue,
  getValues,
  errors,
  opcionesEditables,
  setOpcionesEditables,
  modalOpen,
  setModalOpen,
  opcionParaAnadirValor,
  setOpcionParaAnadirValor,
  nuevoValor,
  setNuevoValor,
  openAddValueModal,
  addOptionValue,
  removeOptionValue,
  handleGenerateVariants,
  handleFileUpload,
  variantFields,
  isUploading,
  SERVER_URL,
  nombreProducto,
}) => {
  const variantes = watch("variantes") || [];

  // Añadir nueva opción
  const handleAddOption = () => {
    const newOptionName = prompt("Nombre de la nueva opción (ej. Talla, Color):");
    if (!newOptionName) return;
    if (opcionesEditables[newOptionName]) {
      alert("Esta opción ya existe");
      return;
    }
    setOpcionesEditables({
      ...opcionesEditables,
      [newOptionName]: [],
    });
    setValue("opciones", {
      ...opcionesEditables,
      [newOptionName]: [],
    });
  };

  // Eliminar opción completa
  const handleRemoveOption = (optionName: string) => {
    const updated = { ...opcionesEditables };
    delete updated[optionName];
    setOpcionesEditables(updated);
    setValue("opciones", updated);
  };

  return (
    <Card className="shadow-sm border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Opciones y Variantes
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* =====================
            OPCIONES
        ===================== */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Opciones</h3>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddOption}
              className="flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Añadir opción
            </Button>
          </div>

          {Object.keys(opcionesEditables).length === 0 && (
            <p className="text-gray-500 text-sm">
              No hay opciones creadas. Agrega una para generar variantes.
            </p>
          )}

          <div className="space-y-6">
            {Object.entries(opcionesEditables).map(([optionName, values]) => (
              <div key={optionName} className="border rounded-lg p-4 bg-muted/30">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-base">{optionName}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(optionName)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                {/* Valores */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {values.map((val) => (
                    <span
                      key={val}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {val}
                      <button
                        type="button"
                        className="ml-1 text-red-500"
                        onClick={() => removeOptionValue(optionName, val)}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openAddValueModal(optionName)}
                  >
                    <PlusCircle className="w-3 h-3 mr-1" /> Agregar valor
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =====================
            VARIANTES
        ===================== */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Variantes</h3>
            <Button
              type="button"
              onClick={handleGenerateVariants}
              variant="outline"
            >
              Generar Variantes
            </Button>
          </div>

          {variantes.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No se han generado variantes aún.
            </p>
          ) : (
            <div className="space-y-4">
              {variantes.map((variant, index) => (
                <div
                  key={index}
                  className="border p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <Label>SKU</Label>
                    <Input
                      {...register(`variantes.${index}.sku` as const)}
                      defaultValue={variant.sku}
                    />

                    <Label>Precio</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variantes.${index}.precio` as const, {
                        valueAsNumber: true,
                      })}
                    />

                    <Label>Stock</Label>
                    <Input
                      type="number"
                      {...register(`variantes.${index}.stock` as const, {
                        valueAsNumber: true,
                      })}
                    />

                    <div className="text-sm text-gray-600">
                      {Object.entries(variant.opciones || {}).map(
                        ([key, value]) => (
                          <span key={key} className="mr-3">
                            <strong>{key}:</strong> {value}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Subir foto variante */}
                  <div className="flex flex-col items-center">
                    <input
                      type="file"
                      accept="image/*"
                      id={`file-variant-${index}`}
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, `variantes.${index}.foto`)
                      }
                    />
                    <label htmlFor={`file-variant-${index}`}>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isUploading}
                        className="flex items-center gap-2"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <ImagePlus className="w-4 h-4" />
                            {variant.foto ? "Reemplazar foto" : "Subir foto"}
                          </>
                        )}
                      </Button>
                    </label>

                    {variant.foto && (
                      <div className="mt-2 relative">
                        <Image
                          src={
                            variant.foto.startsWith("http")
                              ? variant.foto
                              : `${SERVER_URL || ""}${variant.foto}`
                          }
                          alt="Foto variante"
                          width={100}
                          height={100}
                          className="object-cover rounded-md border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* =====================
          MODAL DE NUEVO VALOR
      ===================== */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar valor a {opcionParaAnadirValor}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <Input
              placeholder="Nuevo valor..."
              value={nuevoValor}
              onChange={(e) => setNuevoValor(e.target.value)}
            />
            <Button
              type="button"
              onClick={() =>
                addOptionValue(opcionParaAnadirValor || "", nuevoValor)
              }
            >
              Agregar valor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
