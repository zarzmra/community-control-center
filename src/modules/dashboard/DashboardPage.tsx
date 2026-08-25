"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/modules/dashboard/components/MetricCard";
import { ServiceStatusList } from "@/modules/dashboard/components/ServiceStatusList";
import type {
  DashboardApiResponse,
  RecentCommunity,
} from "@/types/dashboard";
import type { DashboardMetric } from "@/types";
import styles from "./DashboardPage.module.css";

const METRIC_DEFINITIONS = [
  {
    id: "communities",
    label: "Comunidades",
    key: "communities",
  },
  {
    id: "active-bots",
    label: "Bots activos",
    key: "activeBots",
  },
  {
    id: "users",
    label: "Usuarios",
    key: "users",
  },
  {
    id: "messages",
    label: "Mensajes",
    key: "messages",
  },
  {
    id: "automations",
    label: "Automatizaciones",
    key: "automations",
  },
] as const;

export function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardApiResponse | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudo cargar el Dashboard.");
        }

        const data: DashboardApiResponse = await response.json();

        if (!cancelled) {
          setDashboard(data);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("No se pudo conectar con la API del Dashboard.");
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics: readonly DashboardMetric[] = dashboard?.data
    ? METRIC_DEFINITIONS.map((metric) => ({
        id: metric.id,
        label: metric.label,
        value: dashboard.data[metric.key],
        isDemo: false,
      }))
    : [];

  const recentCommunities: readonly RecentCommunity[] =
    dashboard?.data.recentCommunities ?? [];

  return (
    <PageBody>
      <PageHeader
        title="Dashboard"
        description="Vista general del Community Control Center."
      />

      {error ? (
        <Card ariaLabel="Error del Dashboard">
          <EmptyState
            title="No se pudo cargar el Dashboard"
            description={error}
            actionLabel="Reintentar"
            actionHref="/"
          />
        </Card>
      ) : null}

      <section
        className={styles.metrics}
        aria-label="Métricas principales"
      >
        {metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
          />
        ))}
      </section>

      <div className={styles.panels}>
        <Card ariaLabel="Actividad reciente">
          <CardHeader
            title="Actividad reciente"
            description="Eventos recientes del sistema."
          />

          <EmptyState
            title="Sin actividad"
            description="Todavía no hay eventos registrados."
          />
        </Card>

        <Card ariaLabel="Estado de servicios">
          <CardHeader
            title="Estado de servicios"
            description="Estado actual de las conexiones configuradas."
          />

          <ServiceStatusList
            services={dashboard?.services ?? []}
          />
        </Card>
      </div>

      <Card ariaLabel="Comunidades recientes">
        <CardHeader
          title="Comunidades recientes"
          description="Las últimas comunidades registradas en el sistema."
        />

        {recentCommunities.length === 0 ? (
          <EmptyState
            title="Sin comunidades"
            description="Todavía no hay comunidades registradas."
            actionLabel="Crear comunidad"
            actionHref="/communities"
          />
        ) : (
          <div>
            {recentCommunities.map((community) => (
              <Link
                key={community.id}
                href={`/communities/${community.id}`}
              >
                <article>
                  <h3>{community.name}</h3>

                  {community.description ? (
                    <p>{community.description}</p>
                  ) : (
                    <p>Sin descripción.</p>
                  )}

                  <p>
                    {community.members} miembros ·{" "}
                    {community.bots} bots ·{" "}
                    {community.channels} canales
                  </p>
                </article>
              </Link>
            ))}

            <div>
              <Link href="/communities">
                Ver todas las comunidades →
              </Link>
            </div>
          </div>
        )}
      </Card>
    </PageBody>
  );
}
