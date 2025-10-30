/**
 * Servicio para manejar la subida de archivos.
 * Llama al endpoint 'POST /api/v1/uploads/file'
 */
import { api } from '@/lib/api'; // Importa tu instancia de API (Axios)

// El tipo de respuesta que definiste en tu backend
interface UploadResponse {
  url: string;
  filename: string;
  // Añade cualquier otro campo que devuelva tu API de uploads
}

/**
 * Sube un archivo al backend.
 * @param file - El objeto File (de un <input type="file">)
 * @returns La respuesta de la API con la URL del archivo
 */
const uploadFile = async (file: File): Promise<UploadResponse> => {
  // 1. Crea un objeto FormData para enviar el archivo
  const formData = new FormData();
  formData.append('file', file); // 'file' debe coincidir con el FileInterceptor en NestJS

  // 2. Envía la petición como 'multipart/form-data'
  const { data } = await api.post<UploadResponse>('/uploads/file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};

export const uploadService = {
  uploadFile,
};

