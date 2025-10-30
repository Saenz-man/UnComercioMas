// src/app/(admin)/branches/BranchManagement.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner'; // Import toast para las notificaciones

// --- Tus Hooks ---
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from '@/hooks/useBranches';
import type { Branch } from '@/types/branch.types';
import type { BranchPayload } from '@/services/branch.service';
import { BranchForm } from './BranchForm';

// --- UI Components ---
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"; // Mantenemos para eliminar sucursal
import {
  Plus, Warehouse, MoreVertical, Edit, Trash2, Package,
  DollarSign, User, AlertTriangle, Star // Star añadido
} from 'lucide-react';

// --- Imports de Gráficas (Si las mantienes) ---
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Pie, Cell, PieChart
} from 'recharts';

// --- Icono de Matriz ---
const StarIcon = () => (
  <span
    title="Sucursal Matriz"
    className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
  >
    ⭐
  </span>
);

// --- FUNCIÓN SIMULADA PARA VALIDAR INVENTARIO (¡REEMPLAZAR!) ---
const checkInventoryStatus = async (branchId: string): Promise<boolean> => {
    console.log(`Verificando inventario para sucursal: ${branchId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    // SIMULACIÓN: Reemplaza 'ID_SUCURSAL_CON_INVENTARIO_AQUI' con un ID real de prueba
    const branchWithInventoryId = "ID_SUCURSAL_CON_INVENTARIO_AQUI";
    const hasInventory = branchId === branchWithInventoryId;
    console.log(`Sucursal ${branchId} tiene inventario: ${hasInventory}`);
    return hasInventory;
}
// ------------------------------------------------------------------

// --- Componente de Card Individual de Sucursal ---
interface BranchCardProps {
  branch: Branch;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
  onManageInventory: (branch: Branch) => void;
  isMutating: boolean;
}

const BranchCard = ({
  branch, onEdit, onDelete, onManageInventory, isMutating
}: BranchCardProps) => {
  const stats = {
    totalInversion: branch.es_matriz ? 150000 : 23000,
    totalPedidos: branch.es_matriz ? 5 : 0,
    responsable: branch.es_matriz ? 'Admin GDL' : 'Admin',
  };

  return (
    <Card className="flex flex-col justify-between shadow-lg relative">
      {branch.es_matriz && <StarIcon />}
      <CardHeader>
        <CardTitle className="text-xl">{branch.nombre}</CardTitle>
        <CardDescription>{branch.direccion || 'Sin dirección'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
         <div className="flex justify-between text-sm items-center">
          <span className="text-muted-foreground flex items-center"><DollarSign className="h-4 w-4 mr-2" />Total Inversión</span>
          <span className="font-medium">{`$${stats.totalInversion.toLocaleString('es-MX')}`}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-muted-foreground flex items-center"><Package className="h-4 w-4 mr-2" />Pedidos</span>
          <span className="font-medium">{stats.totalPedidos === 0 ? 'Sin Pedidos' : `${stats.totalPedidos} Pedidos`}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-muted-foreground flex items-center"><User className="h-4 w-4 mr-2" />Responsable</span>
          <span className="font-medium">{stats.responsable || 'N/A'}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-2">
        <Button
          className="w-full"
          onClick={() => onManageInventory(branch)}
          disabled={isMutating}
        >
          <Warehouse className="mr-2 h-4 w-4" />
          Actualizar Inventario
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(branch)} disabled={isMutating}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(branch)} disabled={isMutating} className="text-red-600 focus:bg-red-50 focus:text-red-700">
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};

// --- Componente de Card para Añadir ---
const AddBranchCard = ({ onClick }: { onClick: () => void }) => (
  <Card
    onClick={onClick}
    className="shadow-lg border-dashed border-2 text-blue-600 hover:text-blue-800 hover:border-blue-700 cursor-pointer transition-all h-full min-h-[340px]"
  >
    <div className="flex flex-col items-center justify-center h-full">
      <Plus className="h-20 w-20" />
      <span className="mt-2 text-lg font-medium">Agregar Nueva Sucursal</span>
    </div>
  </Card>
);

// --- Componente de Card de Carga ---
const LoadingCard = () => (
  <Card className="shadow-lg h-full min-h-[340px]">
    <CardHeader>
      <Skeleton className="h-6 w-3/4 rounded-md" />
      <Skeleton className="h-4 w-1/2 rounded-md" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-5 w-full rounded-md" />
      <Skeleton className="h-5 w-full rounded-md" />
      <Skeleton className="h-5 w-full rounded-md" />
    </CardContent>
    <CardFooter>
      <Skeleton className="h-10 w-full rounded-md" />
    </CardFooter>
  </Card>
);

// =======================================================
// --- COMPONENTE PRINCIPAL (BranchManagement) ---
// =======================================================
export function BranchManagement() {
    const router = useRouter();
    // Hooks de datos y mutaciones
    const { data: branches = [], isLoading, error } = useBranches();
    const createBranchMutation = useCreateBranch();
    const updateBranchMutation = useUpdateBranch();
    const deleteBranchMutation = useDeleteBranch();

    // Estados para formularios y modales
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
    const [isInventoryChecking, setIsInventoryChecking] = useState(false);
    // 🛑 ESTADO ELIMINADO: Ya no se usa branchToAssignInventory

    // --- LÓGICA DE REDIRECCIÓN/TOAST ACTUALIZADA ---
    const handleOpenInventoryModal = async (branch: Branch) => {
        if (isInventoryChecking) return;

        // CONDICIÓN 1: ES MATRIZ -> Redirige
        if (branch.es_matriz) {
            router.push('/inventario');
            return;
        }

        // NO ES MATRIZ: Verificar inventario
        setIsInventoryChecking(true);
        try {
            const hasInventory = await checkInventoryStatus(branch.id);

            if (hasInventory) {
                // CONDICIÓN 3: TIENE INVENTARIO -> Redirige con ID
                router.push(`/inventario?branchId=${branch.id}`);
            } else {
                // 🛑 CONDICIÓN 2: INVENTARIO VACÍO -> Muestra TOAST
                toast.warning(`La sucursal "${branch.nombre}" aún no tiene inventario.`, {
                  description: 'Por favor, asigna productos desde la Matriz.',
                  position: 'top-right',
                });
                // No redirige
            }
        } catch (err) {
            console.error("Error al verificar inventario:", err);
            toast.error("Ocurrió un error al verificar el inventario.");
        } finally {
            setIsInventoryChecking(false);
        }
    };

    // 🛑 FUNCIÓN ELIMINADA: Ya no se necesita handleAssignInventory

    // --- Handlers de Formularios (Crear/Editar Sucursal) ---
    const handleOpenCreateForm = () => { setEditingBranch(null); setIsFormOpen(true); };
    const handleOpenEditForm = (branch: Branch) => { setEditingBranch(branch); setIsFormOpen(true); };
    const handleCloseForm = () => { setIsFormOpen(false); setEditingBranch(null); };

    // --- Handlers de Mutaciones (Crear/Actualizar/Eliminar Sucursal) ---
    const handleCreateSubmit = (formData: BranchPayload) => {
        createBranchMutation.mutate(formData, {
            onSuccess: handleCloseForm,
            onError: (err: any) => toast.error(`Error al crear: ${err.response?.data?.message || err.message}`),
        });
    };
    const handleUpdateSubmit = (formData: BranchPayload) => {
        if (!editingBranch) return;
        updateBranchMutation.mutate({ id: editingBranch.id, payload: formData }, {
            onSuccess: handleCloseForm,
            onError: (err: any) => toast.error(`Error al actualizar: ${err.response?.data?.message || err.message}`),
        });
    };
    const promptDelete = (branch: Branch) => { setBranchToDelete(branch); };
    const handleConfirmDelete = () => {
        if (!branchToDelete) return;
        deleteBranchMutation.mutate(branchToDelete.id, {
            onSuccess: () => { setBranchToDelete(null); toast.success('Sucursal eliminada.'); },
            onError: (err: any) => toast.error(`Error al eliminar: ${err.response?.data?.message || err.message}`),
        });
    };

    // Estado combinado de mutación
    const isMutating =
        createBranchMutation.isPending ||
        updateBranchMutation.isPending ||
        deleteBranchMutation.isPending ||
        isInventoryChecking;

    // --- Renderizado del Componente ---
    return (
        <div className="p-4 md:p-8 space-y-8">
            {error && (
                <p className="text-red-500">Error al cargar sucursales: {(error as any).message}</p>
            )}

            {/* Sección de Cards de Sucursales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading && Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)}
                {branches.map(branch => (
                    <BranchCard
                        key={branch.id}
                        branch={branch}
                        onEdit={handleOpenEditForm}
                        onDelete={promptDelete}
                        onManageInventory={handleOpenInventoryModal} // Llama a la lógica actualizada
                        isMutating={isMutating}
                    />
                ))}
                <AddBranchCard onClick={handleOpenCreateForm} />
            </div>

            {/* Sección Inferior: Gráficas (Si las mantienes) */}
            {/* ... (Tu JSX de gráficas si aplica) ... */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Ejemplo Gráfica Pie */}
               <Card className="lg:col-span-1 shadow-lg">
                 <CardHeader><CardTitle>Money Stats</CardTitle></CardHeader>
                 <CardContent className="h-[250px]"> {/* Contenido Gráfica */} </CardContent>
               </Card>
               {/* Ejemplo Gráfica Bar */}
               <Card className="lg:col-span-2 shadow-lg">
                 <CardHeader><CardTitle>Net Income</CardTitle></CardHeader>
                 <CardContent className="h-[250px]"> {/* Contenido Gráfica */} </CardContent>
               </Card>
            </div>


            {/* Modal del Formulario (Crear/Editar Sucursal) */}
            {isFormOpen && (
                <BranchForm
                    initialData={editingBranch}
                    onSubmit={editingBranch ? handleUpdateSubmit : handleCreateSubmit}
                    onCancel={handleCloseForm}
                    isLoading={createBranchMutation.isPending || updateBranchMutation.isPending}
                />
            )}

            {/* Modal de Confirmación de Eliminar Sucursal */}
            <AlertDialog open={!!branchToDelete} onOpenChange={() => setBranchToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />¿Estás seguro?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esto eliminará permanentemente la sucursal "<strong>{branchToDelete?.nombre}</strong>".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteBranchMutation.isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={deleteBranchMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteBranchMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 🛑 MODAL ELIMINADO: Ya no se usa el AlertDialog para inventario vacío */}

        </div>
    );
}