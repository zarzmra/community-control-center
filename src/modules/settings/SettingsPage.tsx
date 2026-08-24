import { EmptyState } from "@/components/feedback/EmptyState";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";

export function SettingsPage() {
  return (
    <PageBody>
      <PageHeader
        title="Configuración"
        description="Ajustes generales de la plataforma, accesos y preferencias del sistema."
      />
      <EmptyState
        title="Configuración no disponible"
        description="La autenticación y los ajustes persistentes se introducirán en una fase posterior. No hay datos de demostración."
      />
    </PageBody>
  );
}
