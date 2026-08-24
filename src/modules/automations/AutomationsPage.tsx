import { EmptyState } from "@/components/feedback/EmptyState";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";

export function AutomationsPage() {
  return (
    <PageBody>
      <PageHeader
        title="Automatizaciones"
        description="Define flujos automáticos sobre eventos de comunidades, bots y canales."
      />
      <EmptyState
        title="Aún no hay automatizaciones"
        description="El motor de automatizaciones se implementará en una fase posterior. No hay datos de demostración."
      />
    </PageBody>
  );
}
