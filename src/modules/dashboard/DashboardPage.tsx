import { EmptyState } from "@/components/feedback/EmptyState";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/modules/dashboard/components/MetricCard";
import { ServiceStatusList } from "@/modules/dashboard/components/ServiceStatusList";
import { DASHBOARD_METRICS, SERVICE_STATUSES } from "@/modules/dashboard/data";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  return (
    <PageBody>
      <PageHeader
        title="Dashboard"
        description="Vista general del Community Control Center. Todavía no hay datos reales conectados."
      />

      <section className={styles.metrics} aria-label="Métricas">
        {DASHBOARD_METRICS.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <div className={styles.panels}>
        <Card ariaLabel="Actividad reciente">
          <CardHeader
            title="Actividad reciente"
            description="Los eventos del sistema aparecerán aquí cuando existan."
          />
          <EmptyState
            title="Sin actividad"
            description="No hay actividad reciente. Esta sección se llenará cuando el backend registre eventos."
          />
        </Card>

        <Card ariaLabel="Estado de servicios">
          <CardHeader
            title="Estado de servicios"
            description="Salud de la aplicación y de los servicios pendientes de configurar."
          />
          <ServiceStatusList services={SERVICE_STATUSES} />
        </Card>
      </div>

      <Card ariaLabel="Comunidades recientes">
        <CardHeader
          title="Comunidades recientes"
          description="Todavía no hay comunidades registradas."
        />
        <EmptyState
          title="Sin comunidades"
          description="Las comunidades recientes se mostrarán aquí cuando existan datos reales. No se están usando cifras de demostración."
          actionLabel="Ver comunidades"
          actionHref="/communities"
        />
      </Card>
    </PageBody>
  );
}
