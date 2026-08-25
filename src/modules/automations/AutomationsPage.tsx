"use client";

import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Automation = {
  id: string;
  name: string;
  community_id: string;
  status: "active" | "paused" | "draft";
  trigger: string;
};

type Community = {
  id: string;
  name: string;
};

export function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [status, setStatus] =
    useState<Automation["status"]>("draft");
  const [trigger, setTrigger] = useState("");

  async function loadAutomations() {
    try {
      const response = await fetch("/api/automations");

      if (!response.ok) {
        throw new Error("No se pudieron cargar las automatizaciones.");
      }

      const result: { ok: boolean; data: Automation[] } =
        await response.json();

      setAutomations(result.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las automatizaciones.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCommunities() {
    try {
      const response = await fetch("/api/communities");

      if (!response.ok) {
        throw new Error("No se pudieron cargar las comunidades.");
      }

      const result: { ok: boolean; data: Community[] } =
        await response.json();

      setCommunities(result.data);

      if (result.data.length > 0) {
        setCommunityId((current) => current || result.data[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las comunidades.",
      );
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAutomations();
      void loadCommunities();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("El nombre de la automatización es obligatorio.");
      return;
    }

    if (!communityId) {
      setError("Debes seleccionar una comunidad.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          communityId,
          status,
          trigger: trigger.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "No se pudo crear la automatización.",
        );
      }

      setName("");
      setTrigger("");
      setStatus("draft");
      setShowForm(false);

      await loadAutomations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear la automatización.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(automation: Automation) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${automation.name}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(automation.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/automations/${automation.id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "No se pudo eliminar la automatización.",
        );
      }

      setAutomations((current) =>
        current.filter((item) => item.id !== automation.id),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la automatización.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function getCommunityName(id: string) {
    return (
      communities.find((community) => community.id === id)?.name ??
      "Comunidad desconocida"
    );
  }

  function getStatusLabel(
    automationStatus: Automation["status"],
  ) {
    if (automationStatus === "active") return "Activa";
    if (automationStatus === "paused") return "Pausada";
    return "Borrador";
  }

  function getStatusVariant(
    automationStatus: Automation["status"],
  ): "success" | "neutral" | "warning" {
    if (automationStatus === "active") return "success";
    if (automationStatus === "paused") return "warning";
    return "neutral";
  }

  return (
    <PageBody>
      <PageHeader
        title="Automatizaciones"
        description="Crea y administra flujos automáticos para tus comunidades."
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1rem",
        }}
      >
        <Button
          type="button"
          onClick={() => setShowForm((visible) => !visible)}
        >
          {showForm ? "Cancelar" : "Crear automatización"}
        </Button>
      </div>

      {showForm ? (
        <Card ariaLabel="Crear automatización">
          <form
            onSubmit={handleCreate}
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            <div>
              <label htmlFor="automation-name">Nombre</label>

              <input
                id="automation-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Bienvenida automática"
                required
              />
            </div>

            <div>
              <label htmlFor="automation-community">
                Comunidad
              </label>

              <select
                id="automation-community"
                value={communityId}
                onChange={(event) =>
                  setCommunityId(event.target.value)
                }
                required
              >
                <option value="">
                  Selecciona una comunidad
                </option>

                {communities.map((community) => (
                  <option
                    key={community.id}
                    value={community.id}
                  >
                    {community.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="automation-trigger">
                Disparador
              </label>

              <input
                id="automation-trigger"
                type="text"
                value={trigger}
                onChange={(event) =>
                  setTrigger(event.target.value)
                }
                placeholder="Ej. Nuevo miembro"
              />
            </div>

            <div>
              <label htmlFor="automation-status">
                Estado
              </label>

              <select
                id="automation-status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as Automation["status"],
                  )
                }
              >
                <option value="draft">Borrador</option>
                <option value="active">Activa</option>
                <option value="paused">Pausada</option>
              </select>
            </div>

            <Button type="submit" disabled={creating}>
              {creating
                ? "Creando..."
                : "Crear automatización"}
            </Button>
          </form>
        </Card>
      ) : null}

      {error ? (
        <Card ariaLabel="Error de automatizaciones">
          <EmptyState
            title="Ocurrió un problema"
            description={error}
          />
        </Card>
      ) : null}

      {loading ? (
        <Card ariaLabel="Cargando automatizaciones">
          <EmptyState
            title="Cargando automatizaciones"
            description="Estamos consultando las automatizaciones disponibles."
          />
        </Card>
      ) : null}

      {!loading && !error && automations.length === 0 ? (
        <Card ariaLabel="Sin automatizaciones">
          <EmptyState
            title="Aún no hay automatizaciones"
            description="Crea tu primera automatización para comenzar."
          />
        </Card>
      ) : null}

      {!loading && automations.length > 0 ? (
        <section
          aria-label="Lista de automatizaciones"
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          {automations.map((automation) => (
            <Card
              key={automation.id}
              ariaLabel={automation.name}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2>{automation.name}</h2>

                  <p>
                    Comunidad:{" "}
                    {getCommunityName(automation.community_id)}
                  </p>

                  <p>
                    Disparador:{" "}
                    {automation.trigger || "Sin configurar"}
                  </p>

                  <Badge
                    variant={getStatusVariant(
                      automation.status,
                    )}
                  >
                    {getStatusLabel(automation.status)}
                  </Badge>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleDelete(automation)}
                >
                  {deletingId === automation.id
                    ? "Eliminando..."
                    : "Eliminar"}
                </Button>
              </div>
            </Card>
          ))}
        </section>
      ) : null}
    </PageBody>
  );
}
