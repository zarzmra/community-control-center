"use client";

import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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

type Community = {
  id: string;
  name: string;
};

export function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<Channel["type"]>("other");
  const [status, setStatus] =
    useState<Channel["status"]>("pending");
  const [communityId, setCommunityId] = useState("");

  async function loadChannels() {
    try {
      const response = await fetch("/api/channels");

      if (!response.ok) {
        throw new Error("No se pudieron cargar los canales.");
      }

      const result: { ok: boolean; data: Channel[] } =
        await response.json();

      setChannels(result.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los canales.",
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
      void loadChannels();
      void loadCommunities();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function resetForm() {
    setName("");
    setType("other");
    setStatus("pending");

    if (communities.length > 0) {
      setCommunityId(communities[0].id);
    } else {
      setCommunityId("");
    }

    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(channel: Channel) {
    setName(channel.name);
    setType(channel.type);
    setStatus(channel.status);
    setCommunityId(channel.community_id);
    setEditingId(channel.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("El nombre del canal es obligatorio.");
      return;
    }

    if (!communityId) {
      setError("Debes seleccionar una comunidad.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `/api/channels/${editingId}`
          : "/api/channels",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            type,
            status,
            communityId,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            (isEditing
              ? "No se pudo actualizar el canal."
              : "No se pudo crear el canal."),
        );
      }

      resetForm();
      await loadChannels();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el canal.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(channel: Channel) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${channel.name}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(channel.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/channels/${channel.id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "No se pudo eliminar el canal.",
        );
      }

      setChannels((current) =>
        current.filter((item) => item.id !== channel.id),
      );

      if (editingId === channel.id) {
        resetForm();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el canal.",
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

  function getTypeLabel(channelType: Channel["type"]) {
    if (channelType === "whatsapp") return "WhatsApp";
    if (channelType === "web") return "Web";
    return "Otro";
  }

  function getStatusLabel(channelStatus: Channel["status"]) {
    if (channelStatus === "connected") return "Conectado";
    if (channelStatus === "disconnected") return "Desconectado";
    return "Pendiente";
  }

  function getConnectionStatusLabel(
    connectionStatus: Channel["connection_status"],
  ) {
    return {
      configured: "Configurado",
      pending: "Pendiente de conexión",
      connected: "Conectado",
      disconnected: "Desconectado",
      error: "Error de conexión",
    }[connectionStatus];
  }

  function getConnectionStatusVariant(
    connectionStatus: Channel["connection_status"],
  ) {
    if (connectionStatus === "connected") return "success" as const;
    if (connectionStatus === "error") return "danger" as const;
    if (connectionStatus === "pending") return "warning" as const;
    return "neutral" as const;
  }

  function getStatusVariant(
    channelStatus: Channel["status"],
  ): "success" | "danger" | "warning" {
    if (channelStatus === "connected") return "success";
    if (channelStatus === "disconnected") return "danger";
    return "warning";
  }

  return (
    <PageBody>
      <PageHeader
        title="Canales"
        description="Administra los canales de comunicación conectados a tus comunidades."
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
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm
            ? "Cancelar"
            : "Crear canal"}
        </Button>
      </div>

      {showForm ? (
        <Card
          ariaLabel={
            editingId
              ? "Editar canal"
              : "Crear canal"
          }
        >
          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            <h2>
              {editingId
                ? "Editar canal"
                : "Crear canal"}
            </h2>

            <div>
              <label htmlFor="channel-name">
                Nombre
              </label>

              <input
                id="channel-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Ej. WhatsApp principal"
                required
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="channel-community">
                Comunidad
              </label>

              <select
                id="channel-community"
                value={communityId}
                onChange={(event) =>
                  setCommunityId(event.target.value)
                }
                required
                disabled={saving}
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
              <label htmlFor="channel-type">
                Tipo
              </label>

              <select
                id="channel-type"
                value={type}
                onChange={(event) =>
                  setType(
                    event.target.value as Channel["type"],
                  )
                }
                disabled={saving}
              >
                <option value="whatsapp">
                  WhatsApp
                </option>
                <option value="web">Web</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="channel-status">
                Estado
              </label>

              <select
                id="channel-status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as Channel["status"],
                  )
                }
                disabled={saving}
              >
                <option value="pending">
                  Pendiente
                </option>
                <option value="connected">
                  Conectado
                </option>
                <option value="disconnected">
                  Desconectado
                </option>
              </select>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <Button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Crear canal"}
              </Button>

              {editingId ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancelar edición
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      ) : null}

      {error ? (
        <Card ariaLabel="Error de canales">
          <EmptyState
            title="Ocurrió un problema"
            description={error}
          />
        </Card>
      ) : null}

      {loading ? (
        <Card ariaLabel="Cargando canales">
          <EmptyState
            title="Cargando canales"
            description="Estamos consultando los canales disponibles."
          />
        </Card>
      ) : null}

      {!loading &&
      !error &&
      channels.length === 0 ? (
        <Card ariaLabel="Sin canales">
          <EmptyState
            title="Aún no hay canales"
            description="Crea tu primer canal para comenzar a administrarlo."
          />
        </Card>
      ) : null}

      {!loading && channels.length > 0 ? (
        <section
          aria-label="Lista de canales"
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          {channels.map((channel) => (
            <Card
              key={channel.id}
              ariaLabel={channel.name}
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
                  <h2>{channel.name}</h2>

                  <p>
                    Comunidad:{" "}
                    {getCommunityName(
                      channel.community_id,
                    )}
                  </p>

                  <p>
                    Tipo:{" "}
                    {getTypeLabel(channel.type)}
                  </p>

                  <Badge
                    variant={getStatusVariant(
                      channel.status,
                    )}
                  >
                    {getStatusLabel(
                      channel.status,
                    )}
                  </Badge>

                  <Badge
                    variant={getConnectionStatusVariant(
                      channel.connection_status,
                    )}
                  >
                    {getConnectionStatusLabel(
                      channel.connection_status,
                    )}
                  </Badge>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      startEdit(channel)
                    }
                  >
                    Editar
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      handleDelete(channel)
                    }
                    disabled={
                      deletingId === channel.id
                    }
                  >
                    {deletingId === channel.id
                      ? "Eliminando..."
                      : "Eliminar"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </section>
      ) : null}
    </PageBody>
  );
}
