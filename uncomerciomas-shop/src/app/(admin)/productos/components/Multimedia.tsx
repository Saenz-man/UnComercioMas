"use client";

import React from "react";
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
import { ProductFormValues } from "./ProductForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";

interface MultimediaProps {
  watch: UseFormWatch<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  handleFileUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: "fotos" | "video" | `variantes.${number}.foto`
  ) => Promise<void>;
  isUploading: boolean;
  SERVER_URL?: string;
  removeMainPhoto: (indexToRemove: number) => void;
}

export const Multimedia: React.FC<MultimediaProps> = ({
  watch,
  setValue,
  handleFileUpload,
  isUploading,
  SERVER_URL,
  removeMainPhoto,
}) => {
  const fotos = watch("fotos") || [];
  const video = watch("video");

  return (
    <Card className="shadow-sm border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Multimedia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subir fotos */}
        <div>
          <label className="block font-medium mb-2">Fotos del producto</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "fotos")}
            className="hidden"
            id="file-upload-fotos"
          />
          <label htmlFor="file-upload-fotos">
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
                  <Upload className="w-4 h-4" />
                  Subir foto
                </>
              )}
            </Button>
          </label>

          {/* Vista previa de fotos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {fotos.length === 0 && (
              <p className="text-gray-500 text-sm col-span-full">
                No se han subido imágenes aún.
              </p>
            )}
            {fotos.map((foto, index) => {
              const fotoSrc =
                foto && foto.startsWith("http")
                  ? foto
                  : foto
                  ? `${SERVER_URL || ""}${foto}`
                  : "/vacio.jpg"; // fallback

              return (
                <div
                  key={index}
                  className="relative group border rounded-lg overflow-hidden"
                >
                  <Image
                    src={fotoSrc || "/vacio.jpg"}
                    alt={`Foto ${index + 1}`}
                    width={200}
                    height={200}
                    className="object-cover w-full h-32 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => foto && removeMainPhoto(index)}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subir video */}
        <div>
          <label className="block font-medium mb-2">Video (opcional)</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => handleFileUpload(e, "video")}
            className="hidden"
            id="file-upload-video"
          />
          <label htmlFor="file-upload-video">
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
                  <Upload className="w-4 h-4" />
                  Subir video
                </>
              )}
            </Button>
          </label>

          {video && (
            <div className="mt-4 relative">
              <video
                src={
                  video.startsWith("http")
                    ? video
                    : `${SERVER_URL || ""}${video}`
                }
                controls
                className="w-full rounded-lg"
              />
              <button
                type="button"
                onClick={() => setValue("video", null)}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
