import React from "react";
import {
  Control,
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
  UseFormGetValues,
  FieldArrayWithId,
} from "react-hook-form";
// --- 1. IMPORTAR EL TIPO ---
import { ProductFormValues } from "./ProductForm"; 

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, X, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- 2. ACTUALIZAR LAS PROPS ---
interface OpcionesVariantesProps {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  getValues: UseFormGetValues<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  opcionesEditables: Record<string, string[]>;
  setOpcionesEditables: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  modalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  opcionParaAnadirValor: string | null;
  setOpcionParaAnadirValor: React.Dispatch<React.SetStateAction<string | null>>;
  nuevoValor: string;
  setNuevoValor: React.Dispatch<React.SetStateAction<string>>;
  openAddValueModal: (optionName: string) => void;
  addOptionValue: (optionName: string, value: string) => void;
  removeOptionValue: (optionName: string, valueToRemove: string) => void;
  handleGenerateVariants: () => void;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "fotos" | "video" | `variantes.${number}.foto`
  ) => Promise<void>;
  variantFields: FieldArrayWithId<ProductFormValues, "variantes", "id">[]; // <-- Tipo actualizado
  isUploading: boolean;
  SERVER_URL: string | undefined;
  nombreProducto: string;
}

export function OpcionesYVariantes({
  control,
  register,
  watch,
  setValue,
  // ...etc
  opcionesEditables,
  handleGenerateVariants,
  handleFileUpload,
  variantFields,
  isUploading,
  SERVER_URL,
  nombreProducto,
}: OpcionesVariantesProps) {
  
  const optionKeys = Object.keys(opcionesEditables);

  return (
    <div className="space-y-6">
      
      {/* --- Tarjeta 1: Opciones --- */}
      <div className="p-6 border rounded-lg shadow-sm space-y-6 bg-white">
        {/* ... (JSX de Opciones sin cambios) ... */}
      </div>

      {/* --- Tarjeta 2: Variantes --- */}
      <div className="p-6 border rounded-lg shadow-sm space-y-4 bg-white">
        <h2 className="text-xl font-semibold">Variantes</h2>
        
        {variantFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Las variantes generadas aparecerán aquí.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  {optionKeys.map(key => <TableHead key={key}>{key}</TableHead>)}
                  <TableHead>Agregar Foto</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variantFields.map((field, index) => {
                  const variantPhotoPath = watch(`variantes.${index}.foto`);
                  const variantPhotoUrl =
                    variantPhotoPath && !variantPhotoPath.startsWith("http")
                      ? `${SERVER_URL}${variantPhotoPath}`
                      : variantPhotoPath;
                  
                  return (
                    <TableRow key={field.id}>
                      <TableCell className="min-w-[150px]">
                        <Input
                          placeholder="SKU"
                          {...register(`variantes.${index}.sku` as const)}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      
                      {/* 'field.opciones' ahora es reconocido */}
                      {optionKeys.map(key => (
                        <TableCell key={key} className="whitespace-nowrap">
                          {field.opciones?.[key] || "-"}
                        </TableCell>
                      ))}

                      <TableCell className="w-[150px]">
                        {/* ... (JSX de Foto sin cambios) ... */}
                      </TableCell>

                      <TableCell className="text-right w-[100px]">
                        <Input
                          type="number"
                          placeholder="0"
                          {...register(`variantes.${index}.stock` as const, { valueAsNumber: true })}
                          className="h-8 text-sm text-right"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* --- Diálogo de Creación de Valor (oculto) --- */}
      <Dialog>{/* ... (contenido del diálogo sin cambios) ... */}</Dialog>
    </div>
  );
}