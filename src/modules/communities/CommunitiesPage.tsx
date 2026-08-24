import { EmptyState } from "@/components/feedback/EmptyState";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";

export function CommunitiesPage() {
  return (
    <PageBody>
      <PageHeader
        title="Comunidades"
        description="Administra las comunidades del sistema cuando el backend esté disponible."
      />
      <EmptyState
        title="Aún no hay comunidades"
        description="Esta sección está preparada para listar, crear y configurar comunidades. No hay datos de demostración."
      />
    </PageBody>
  );
}
