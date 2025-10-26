import axios from "axios";

// 1. Log para verificar la URL base que se está usando
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
console.log("[api.ts] API Base URL:", baseURL); 

export const api = axios.create({
  baseURL: baseURL, 
});

// 2. Log en el interceptor para ver cada petición saliente
api.interceptors.request.use((config) => {
  console.log("[api.ts] Interceptor: Petición saliente", {
    method: config.method?.toUpperCase(),
    url: config.url,
    headers: config.headers
  });
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("[api.ts] Interceptor: Token añadido a la cabecera.");
  } else {
    console.log("[api.ts] Interceptor: No se encontró token.");
  }
  return config;
}, (error) => {
  // Log para errores antes de enviar la petición (raro)
  console.error("[api.ts] Interceptor: Error en configuración de petición", error);
  return Promise.reject(error);
});

// 3. (Opcional) Interceptor de respuesta para ver lo que llega
api.interceptors.response.use((response) => {
  console.log("[api.ts] Interceptor: Respuesta recibida", {
    status: response.status,
    url: response.config.url,
    data: response.data // Cuidado: no loguear datos sensibles en producción
  });
  return response;
}, (error) => {
  console.error("[api.ts] Interceptor: Error en respuesta de API", {
    message: error.message,
    status: error.response?.status,
    url: error.config?.url,
    responseData: error.response?.data // Cuidado con datos sensibles
  });
  return Promise.reject(error);
});