import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api'; // Asumo que así se llama tu instancia de Axios
import { toast } from 'sonner';

// 1. Define la función que sube la imagen
const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file); // 'file' debe ser el 'key' que espera tu backend

  try {
    // 2. Apunta a tu endpoint de 'upload'
    const { data } = await api.post('/uploads/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // 3. Asume que tu API devuelve un objeto como { url: '...' }
    // Ajústalo a lo que tu backend realmente devuelva
    if (data && data.url) {
      
      // --- INICIO DE LA CORRECCIÓN ---
      // data.url probablemente es una ruta relativa (ej: /uploads/imagen.png)
      // Necesitamos la URL base de la API (donde corre en el puerto 3000)
      const apiBaseUrl = 'http://localhost:3000'; 
      
      // Unimos la base de la API con la ruta de la imagen
      const absoluteUrl = `${apiBaseUrl}${data.url}`;
      
      // Devolvemos la URL absoluta
      // ej: "http://localhost:3000/uploads/imagen.png"
      return absoluteUrl;
      // --- FIN DE LA CORRECCIÓN ---

    } else {
      // Si la API devuelve la URL directamente (sin objeto)
      // return data;
      throw new Error('La respuesta de la API no tiene el formato esperado.');
    }

  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage);
  }
};

// 4. Exporta el hook 'useUpload'
export const useUpload = () => {
  return useMutation({
    mutationFn: uploadImage,
    onSuccess: (url) => {
      toast.success('Imagen subida con éxito.');
      console.log('Imagen subida:', url); // <-- Este log ahora mostrará la URL absoluta
    },
    onError: (error) => {
      toast.error(`Error al subir imagen: ${error.message}`);
      console.error(error);
    },
  });
};
