"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Community = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  members: number;
  bots: number;
  channels: number;
};

type Bot = {
  id: string;
  name: string;
  community_id: string;
  status: "draft" | "stopped" | "starting" | "running" | "stopping" | "error";
};

type Channel = {
  id: string;
  name: string;
  type: "whatsapp" | "web" | "other";
  status: "connected" | "disconnected" | "pending";
  connection_status:
    | "configured"
    | "pending"
    | "connected"
    | "disconnected"
    | "error";
  community_id: string;
};

type Automation = {
  id: string;
  name: string;
  community_id: string;
  status: "active" | "paused" | "draft";
  trigger: string;
};

type CommunityDetailPageProps = {
  id: string;
};

export function CommunityDetailPage({
  id,
}: CommunityDetailPageProps) {
  const router = useRouter();

  const [community, setCommunity] =
    useState<Community | null>(null);

  const [bots, setBots] = useState<Bot[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [automations, setAutomations] =
    useState<Automation[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [
          communityResponse,
          botsResponse,
          channelsResponse,
          automationsResponse,
        ] = await Promise.all([
          fetch(`/api/communities/${id}`),
          fetch(`/api/bots?communityId=${encodeURIComponent(id)}`),
          fetch(`/api/channels?communityId=${encodeURIComponent(id)}`),
          fetch(`/api/automations?communityId=${encodeURIComponent(id)}`),
        ]);

        const communityResult = await communityResponse.json();
        const botsResult = await botsResponse.json();
        const channelsResult = await channelsResponse.json();
        const automationsResult =
          await automationsResponse.json();

        if (!communityResponse.ok) {
          throw new Error(
            communityResult.error ??
              "No se pudo cargar la comunidad.",
          );
        }

        if (!communityResult.data) {
          throw new Error(
            "No se recibió información de la comunidad.",
          );
        }

        if (!cancelled) {
          setCommunity(communityResult.data);
          setName(communityResult.data.name);
          setDescription(
            communityResult.data.description,
          );

          setBots(
            (botsResult.data ?? []).filter(
              (bot: Bot) =>
                bot.community_id === id,
            ),
          );

          setChannels(
            (channelsResult.data ?? []).filter(
              (channel: Channel) =>
                channel.community_id === id,
            ),
          );

          setAutomations(
            (automationsResult.data ?? []).filter(
              (automation: Automation) =>
                automation.community_id === id,
            ),
          );

          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo conectar con la API.",
          );
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, retry]);

  async function handleSave() {
    if (!name.trim()) {
      setError(
        "El nombre de la comunidad es obligatorio.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/communities/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "No se pudo actualizar la comunidad.",
        );
      }

      setCommunity(result.data);
      setName(result.data.name);
      setDescription(result.data.description);
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la comunidad.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    if (!community) return;

    setName(community.name);
    setDescription(community.description);
    setError(null);
    setEditing(false);
  }

  async function handleDelete() {
    if (!community) return;

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${community.name}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/communities",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: community.id,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "No se pudo eliminar la comunidad.",
        );
      }

      router.push("/communities");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la comunidad.",
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <PageBody>
        <PageHeader title="Cargando comunidad" />

        <Card ariaLabel="Cargando detalles">
          <LoadingState
            label="Consultando comunidad y recursos..."
          />
        </Card>
      </PageBody>
    );
  }

  if (error && !community) {
    return (
      <PageBody>
        <PageHeader title="Detalle de Comunidad" />

        <Card ariaLabel="Error de carga">
          <ErrorState
            title="Ocurrió un problema"
            description={error}
            onRetry={() => setRetry((value) => !value)}
          />

          <div style={{ marginTop: "1rem" }}>
            <Button
              href="/communities"
              variant="secondary"
            >
              Volver a comunidades
            </Button>
          </div>
        </Card>
      </PageBody>
    );
  }

  if (!community) return null;

  return (
    <PageBody>
      <PageHeader
        title={community.name}
        description="Administra la información, bots, canales y automatizaciones de esta comunidad."
      />

      {error ? (
        <Card ariaLabel="Error de comunidad">
          <ErrorState
            title="Ocurrió un problema"
            description={error}
          />
        </Card>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          marginTop: "1.5rem",
        }}
      >
        <Card ariaLabel="Información de la comunidad">
          {editing ? (
            <div
              style={{
                display: "grid",
                gap: "1rem",
              }}
            >
              <div>
                <label htmlFor="community-name">
                  Nombre
                </label>

                <input
                  id="community-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  disabled={saving}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="community-description">
                  Descripción
                </label>

                <textarea
                  id="community-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  disabled={saving}
                  rows={5}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : "Guardar cambios"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div>
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
                  <h2
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {community.name}
                  </h2>

                  <p
                    style={{
                      color:
                        "var(--color-text-secondary, #666)",
                      marginBottom: "1rem",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {community.description ||
                      "Sin descripción disponible."}
                  </p>

                  <Badge
                    variant={
                      community.status === "active"
                        ? "success"
                        : "neutral"
                    }
                  >
                    {community.status === "active"
                      ? "Activo"
                      : "Inactivo"}
                  </Badge>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setEditing(true);
                  }}
                >
                  Editar
                </Button>
              </div>
            </div>
          )}
        </Card>

        <section
          aria-label="Estadísticas generales"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          <Card ariaLabel="Miembros">
            <div
              style={{
                textAlign: "center",
                padding: "1rem",
              }}
            >
              <span
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  display: "block",
                }}
              >
                {community.members}
              </span>

              <span>Miembros</span>
            </div>
          </Card>

          <Card ariaLabel="Bots">
            <div
              style={{
                textAlign: "center",
                padding: "1rem",
              }}
            >
              <span
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  display: "block",
                }}
              >
                {community.bots}
              </span>

              <span>Bots conectados</span>
            </div>
          </Card>

          <Card ariaLabel="Canales">
            <div
              style={{
                textAlign: "center",
                padding: "1rem",
              }}
            >
              <span
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  display: "block",
                }}
              >
                {community.channels}
              </span>

              <span>Canales</span>
            </div>
          </Card>
        </section>

        <Card ariaLabel="Bots de la comunidad">
          <h2>Bots</h2>

          {bots.length === 0 ? (
            <p>No hay bots configurados.</p>
          ) : (
            <div>
              {bots.map((bot) => (
                <div key={bot.id}>
                  <strong>{bot.name}</strong>{" "}
                  <Badge
                    variant={
                      bot.status === "running" || bot.status === "starting"
                        ? "success"
                        : bot.status === "error"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {bot.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card ariaLabel="Canales de la comunidad">
          <h2>Canales</h2>

          {channels.length === 0 ? (
            <p>No hay canales configurados.</p>
          ) : (
            <div>
              {channels.map((channel) => (
                <div key={channel.id}>
                  <strong>{channel.name}</strong>{" "}
                  <span>({channel.type})</span>{" "}
                  <Badge
                    variant={
                      channel.status === "connected"
                        ? "success"
                        : channel.status === "pending"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {channel.status}
                  </Badge>
                  <Badge
                    variant={
                      channel.connection_status === "connected"
                        ? "success"
                        : channel.connection_status === "error"
                          ? "danger"
                          : channel.connection_status === "pending"
                            ? "warning"
                            : "neutral"
                    }
                  >
                    {channel.connection_status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card ariaLabel="Automatizaciones de la comunidad">
          <h2>Automatizaciones</h2>

          {automations.length === 0 ? (
            <p>No hay automatizaciones configuradas.</p>
          ) : (
            <div>
              {automations.map((automation) => (
                <div key={automation.id}>
                  <strong>{automation.name}</strong>{" "}
                  <Badge
                    variant={
                      automation.status === "active"
                        ? "success"
                        : automation.status === "paused"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {automation.status}
                  </Badge>

                  {automation.trigger ? (
                    <p>
                      Disparador: {automation.trigger}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card ariaLabel="Acciones de comunidad">
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <Button
              href="/communities"
              variant="secondary"
            >
              Volver a comunidades
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting
                ? "Eliminando..."
                : "Eliminar comunidad"}
            </Button>
          </div>
        </Card>
      </div>
    </PageBody>
  );
}
