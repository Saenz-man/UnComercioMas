"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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

// ✅ 1. IMPORTA TU CLIENTE API
import { api } from '@/lib/api'; // (O la ruta a tu cliente axios/api)

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
} from "@/components/ui/alert-dialog";
import {
  Plus, Warehouse, MoreVertical, Edit, Trash2, Package,
  DollarSign, User, AlertTriangle, Star
} from 'lucide-react';

// ... (Componente StarIcon se mantiene igual) ...
const StarIcon = () => (
  <span
    title="Sucursal Matriz"
    className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
  >
    ⭐
  </span>
);


// ❌ 2. ELIMINAMOS LA FUNCIÓN SIMULADA 'checkInventoryStatus'


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
         <div className="flex justify-between text-sm items-center"><span className="text-muted-foreground flex items-center"><DollarSign className="h-4 w-4 mr-2" />Total Inversión</span><span className="font-medium">{`$${stats.totalInversion.toLocaleString('es-MX')}`}</span></div>
        <div className="flex justify-between text-sm items-center"><span className="text-muted-foreground flex items-center"><Package className="h-4 w-4 mr-2" />Pedidos</span><span className="font-medium">{stats.totalPedidos === 0 ? 'Sin Pedidos' : `${stats.totalPedidos} Pedidos`}</span></div>
        <div className="flex justify-between text-sm items-center"><span className="text-muted-foreground flex items-center"><User className="h-4 w-4 mr-2" />Responsable</span><span className="font-medium">{stats.responsable || 'N/A'}</span></div>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-2">
        <Button
          className="w-full"
          onClick={() => onManageInventory(branch)}
          disabled={isMutating}
        >
          <Warehouse className="mr-2 h-4 w-4" />
          {/* ✅ 3. CAMBIAMOS EL TEXTO PARA MÁS CLARIDAD */}
          {branch.es_matriz ? 'Gestionar Matriz' : 'Ver Inventario'}
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

// ... (AddBranchCard y LoadingCard se mantienen igual) ...
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
    const { data: branches = [], isLoading, error } = useBranches();
    const createBranchMutation = useCreateBranch();
    const updateBranchMutation = useUpdateBranch();
    const deleteBranchMutation = useDeleteBranch();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
    const [isInventoryChecking, setIsInventoryChecking] = useState(false);

    // --- LÓGICA DE REDIRECCIÓN/TOAST ACTUALIZADA ---
    const handleOpenInventoryModal = async (branch: Branch) => {
        if (isInventoryChecking) return;

        if (branch.es_matriz) {
            router.push('/inventario');
            return;
        }

        // ✅ 4. LÓGICA REAL PARA VERIFICAR INVENTARIO
        setIsInventoryChecking(true);
        try {
            // Llamamos a tu endpoint real
            // Asumiendo que /api/v1 está en tu baseURL de axios
            const { data: inventory } = await api.get(`/inventory/branch/${branch.id}`);
            
            // El endpoint devuelve un array. Si tiene items, hasInventory es true.
            const hasInventory = Array.isArray(inventory) && inventory.length > 0;

            if (hasInventory) {
                // TIENE INVENTARIO -> Redirige
                toast.info(`Cargando inventario de ${branch.nombre}...`);
                // 🛑 ¡IMPORTANTE! Esta ruta tiene que existir y tu página de inventario
                // debe saber cómo manejar el query param `branchId`
                router.push(`/inventario?branchId=${branch.id}`);
            } else {
                // INVENTARIO VACÍO -> Muestra TOAST
                toast.warning(`La sucursal "${branch.nombre}" aún no tiene inventario.`, {
                  description: 'Por favor, asigna productos desde la Matriz.',
                  position: 'top-right',
                });
            }
        } catch (err: any) {
            console.error("Error al verificar inventario:", err);
            toast.error("Ocurrió un error al verificar el inventario.", {
              description: err.response?.data?.message || err.message
            });
        } finally {
            setIsInventoryChecking(false);
        }
    };

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
                        onManageInventory={handleOpenInventoryModal}
                        isMutating={isMutating}
                    />
                ))}
                <AddBranchCard onClick={handleOpenCreateForm} />
            </div>

            {/* ... (Tu JSX de gráficas) ... */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <Card className="lg:col-span-1 shadow-lg">
                 <CardHeader><CardTitle>Money Stats</CardTitle></CardHeader>
                 <CardContent className="h-[250px]"> {/* Contenido Gráfica */} </CardContent>
               </Card>
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
        </div>
    );
}