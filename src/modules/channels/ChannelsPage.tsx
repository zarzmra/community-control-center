import { EmptyState } from "@/components/feedback/EmptyState";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";

export function ChannelsPage() {
  return (
    <PageBody>
      <PageHeader
        title="Canales"
        description="Integra canales de comunicación cuando esas conexiones estén disponibles."
      />
      <EmptyState
        title="Aún no hay canales"
        description="WhatsApp y el resto de integraciones se añadirán más adelante. No hay datos de demostración."
      />
    </PageBody>
  );
}
