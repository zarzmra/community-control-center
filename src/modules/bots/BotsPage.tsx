import { EmptyState } from "@/components/feedback/EmptyState";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";

export function BotsPage() {
  return (
    <PageBody>
      <PageHeader
        title="Bots"
        description="Supervisa el estado y la configuración de los bots asociados a cada comunidad."
      />
      <EmptyState
        title="Aún no hay bots"
        description="La gestión de bots se habilitará en una fase posterior. No hay datos de demostración."
      />
    </PageBody>
  );
}
