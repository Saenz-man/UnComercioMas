'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
// Usamos el tipo inferido de Zod
import { ProductFormData } from './ProductForm'; // Asumiendo que exportas el tipo
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUpload } from '@/hooks/useUpload';
import Image from 'next/image';
import { Trash2, UploadCloud } from 'lucide-react';
import { useState } from 'react';

export function Multimedia() {
  // Quitamos CreateProductPayload y usamos el tipo de RHF
  const { control, register, setValue, formState: { errors } } = useFormContext<ProductFormData>();
  const [isUploading, setIsUploading] = useState(false);
  const uploadMutation = useUpload();

  // --- CORRECCIÓN 1: 'name' ahora es "fotos" y es válido ---
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fotos',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    uploadMutation.mutate(file, {
      onSuccess: (url) => {
        // --- CORRECCIÓN 2: 'append' espera un objeto ---
        append({ value: url }); 
        setIsUploading(false);
      },
      onError: () => {
        setIsUploading(false);
      },
    });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    uploadMutation.mutate(file, {
      onSuccess: (url) => {
        setValue('video', url, { shouldValidate: true }); 
        setIsUploading(false);
      },
      onError: () => {
        setIsUploading(false);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multimedia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Fotos del Producto</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {fields.map((field, index) => (
              <div key={field.id} className="relative group">
                {/* --- CORRECCIÓN 3: La URL está en 'field.value' --- */}
                <Image
                  src={field.value} 
                  alt={`Foto ${index + 1}`}
                  width={150}
                  height={150}
                  className="rounded-md object-cover aspect-square"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Label className="flex flex-col items-center justify-center border-2 border-dashed rounded-md aspect-square cursor-pointer hover:bg-muted">
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isUploading ? 'Subiendo...' : 'Añadir'}
              </span>
              <Input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </Label>
          </div>
          {/* @ts-ignore */}
          {errors.fotos && <p className="text-red-500 text-sm mt-1">{errors.fotos?.message || errors.fotos?.[0]?.value?.message}</p>}
        </div>
        
        <div>
          <Label>Video del Producto (Opcional)</Label>
          <Controller
            name="video"
            control={control}
            render={({ field }) => (
              <>
                <Input
                  type="file"
                  className="mt-2"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={isUploading}
                />
                {field.value && (
                  <div className="mt-2">
                    <p className="text-sm truncate">Video: {field.value}</p>
                  </div>
                )}
              </>
            )}
          />
          {errors.video && <p className="text-red-500 text-sm mt-1">{errors.video.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
