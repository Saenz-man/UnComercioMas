"use client";

import { useState } from 'react'; // <-- Importar useState
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthService } from "@/services/auth.service";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from 'next/link'; // <-- Importar Link para ir a Registro

// Iconos (puedes usar una librería como react-icons o SVGs)
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const EyeSlashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>;


const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"), // Ajustado a 8
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false); // <-- Estado para visibilidad
  console.log("[LoginPage] Renderizando página de login.");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      console.log("[LoginPage] MutationFn: Llamando a AuthService.login con:", data);
      return AuthService.login(data.email, data.password);
    },
    onSuccess: (res) => {
      console.log("[LoginPage] Mutation Success: Respuesta recibida", res);
      // Guardar token (usar httpOnly cookies en producción para más seguridad)
      Cookies.set("token", res.access_token, { expires: 1 }); // Expira en 1 día
      localStorage.setItem("token", res.access_token); // Menos seguro, para fácil acceso
      localStorage.setItem("user", JSON.stringify(res.user)); // Guardar info del usuario
      console.log("[LoginPage] Mutation Success: Token e info de usuario guardados.");
      
      if (res.user.rol === "admin" || res.user.rol === "superadmin") {
        console.log("[LoginPage] Mutation Success: Rol admin/superadmin detectado. Redirigiendo a dashboard...");
        router.push("/dashboard"); 
      } else {
        console.log("[LoginPage] Mutation Success: Rol cliente/vendedor. Redirigiendo a inicio...");
        router.push("/"); // Redirige a la tienda
      }
    },
    onError: (error: any) => { // Tipado más específico para error
      console.error("[LoginPage] Mutation Error: Falló el login", error); 
      // Mostrar mensaje más específico si la API lo envía
      const apiErrorMessage = error.response?.data?.message || "Credenciales inválidas o error en el servidor.";
      alert(Array.isArray(apiErrorMessage) ? apiErrorMessage.join(', ') : apiErrorMessage);
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("[LoginPage] onSubmit: Formulario enviado con datos:", data);
    mutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6" // Aumentado shadow y max-w
      >
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Iniciar Sesión</h1>

        {/* Campo Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            {...register("email")}
            className={`w-full border p-3 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.email && <p className="mt-1 text-red-600 text-xs">{errors.email.message}</p>}
        </div>

        {/* Campo Contraseña con botón de mostrar/ocultar */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"} // <-- Tipo dinámico
              placeholder="••••••••"
              {...register("password")}
              className={`w-full border p-3 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            />
            <button
              type="button" // <-- Importante: type="button" para no enviar el form
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-red-600 text-xs">{errors.password.message}</p>}
        </div>

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? "Ingresando..." : "Entrar"}
        </button>

        {/* Mensaje de Error General */}
        {mutation.isError && (
          <p className="text-red-600 text-sm text-center">
            {/* Intenta mostrar el error específico de la API */}
            {(mutation.error as any)?.response?.data?.message || 'Error al intentar iniciar sesión.'}
          </p>
        )}

        {/* Enlace a Registro */}
        <p className="text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </form>
    </div>
  );
}