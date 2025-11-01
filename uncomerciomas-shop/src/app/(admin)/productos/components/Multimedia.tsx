import React from "react";
import {
  UseFormWatch,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
// --- 1. IMPORTAR EL TIPO DEL FORMULARIO ---
import { ProductFormValues } from "./ProductForm"; 
// UI
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, X, ImageOff } from "lucide-react";

// --- 2. ACTUALIZAR LAS PROPS ---
interface MultimediaProps {
  watch: UseFormWatch<ProductFormValues>; // <-- Usar ProductFormValues
  setValue: UseFormSetValue<ProductFormValues>; // <-- Usar ProductFormValues
  getValues?: UseFormGetValues<ProductFormValues>; 
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "fotos" | `variantes.${number}.foto` | "video"
  ) => Promise<void>;
  removeMainPhoto: (indexToRemove: number) => void; // <-- Prop añadida
  isUploading: boolean;
  SERVER_URL: string | undefined;
}

export function Multimedia({
  watch,
  setValue,
  handleFileUpload,
  removeMainPhoto,
  isUploading,
  SERVER_URL,
}: MultimediaProps) {

  const fotos = watch("fotos") ?? [];
  const video = watch("video");
  const mainPhoto = fotos[0] || null;

  const mainPhotoUrl =
    mainPhoto && !mainPhoto.startsWith("http")
      ? `${SERVER_URL}${mainPhoto}`
      : mainPhoto;

  return (
    <div className="p-6 border rounded-lg shadow-sm space-y-4 bg-white">
      
      <div className="aspect-square border rounded-md bg-muted/30 flex items-center justify-center overflow-hidden">
        {mainPhotoUrl ? (
          <img
            src={mainPhotoUrl}
            alt="Foto principal del producto"
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageOff className="h-16 w-16 text-muted-foreground" />
        )}
      </div>

      <div>
        <Label htmlFor="main-photo-upload" className="sr-only">Agregar/Actualizar Foto</Label>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isUploading}
          onClick={() => document.getElementById('main-photo-upload')?.click()}
        >
          {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Agregar/Actualizar Foto
        </Button>
        <Input
          id="main-photo-upload"
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, "fotos")}
          className="hidden" 
          disabled={isUploading}
        />
      </div>

      <div>
        <Label htmlFor="main-video-upload" className="sr-only">Agregar Video</Label>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isUploading}
          onClick={() => document.getElementById('main-video-upload')?.click()}
        >
          {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {video ? "Actualizar Video" : "Agregar Video"}
        </Button>
        <Input
          id="main-video-upload"
          type="file"
          accept="video/*"
          onChange={(e) => handleFileUpload(e, "video")}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {video && (
        <div className="mt-2 relative w-full border rounded p-2">
          {/* ... (previsualización de video sin cambios) ... */}
        </div>
      )}
    </div>
  );
}

// export default Multimedia; // No es necesario si usas 'export function'