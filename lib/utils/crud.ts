import { useToasts } from "@/lib/hooks/use-toast";

export async function confirmAction(message: string): Promise<boolean> {
  return window.confirm(message);
}

export function useConfirmDelete() {
  const { error, success } = useToasts();

  return async (action: () => Promise<void>, entityName: string) => {
    const confirmed = await confirmAction(
      `¿Estás seguro de que deseas eliminar ${entityName}? Esta acción no se puede deshacer.`
    );

    if (confirmed) {
      try {
        await action();
        success(`${entityName} eliminado exitosamente`);
      } catch (err) {
        error("Error", "No se pudo eliminar el elemento");
      }
    }
  };
}
