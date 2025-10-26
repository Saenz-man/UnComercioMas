import { api } from "@/lib/api";
import type { User } from "../types/user.types"; // Asume que tienes este tipo

export interface LoginResponse {
  access_token: string;
  user: User; // Usa tu tipo User aquí
}

// Asume que el registro devuelve el usuario creado (sin contraseña)
export type RegisterResponse = Omit<User, 'hash_contrasena'>;

export interface RegisterPayload {
  email: string;
  password: string;
  // Añade otros campos si tu API los requiere para el registro (ej. nombre)
}

export const AuthService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    console.log("[AuthService] Iniciando login para:", email);
    try {
      // Endpoint de login
      const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
      console.log("[AuthService] Login exitoso:", data);
      return data;
    } catch (error) {
      console.error("[AuthService] Error durante el login:", error);
      throw error;
    }
  },

  // --- NUEVO MÉTODO DE REGISTRO ---
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    console.log("[AuthService] Iniciando registro para:", payload.email);
    try {
      // Endpoint de registro (asegúrate que sea /auth/register en tu API)
      const { data } = await api.post<RegisterResponse>("/auth/register", payload);
      console.log("[AuthService] Registro exitoso:", data);
      return data;
    } catch (error) {
      console.error("[AuthService] Error durante el registro:", error);
      throw error;
    }
  },
  // --- FIN DE NUEVO MÉTODO ---
};

// --- (Opcional pero recomendado) Crea src/types/user.types.ts ---
// export interface User {
//   id: string;
//   email: string;
//   rol: 'cliente' | 'vendedor' | 'admin' | 'superadmin';
//   activo: boolean;
//   fecha_creacion: string;
//   // No incluyas hash_contrasena aquí
// }