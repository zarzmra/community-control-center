"use client";

import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Bot = {
  id: string;
  name: string;
  community_id: string;
  status: "online" | "offline" | "error";
  created_at: string;
};

type Community = {
  id: string;
  name: string;
};

export function BotsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);

  const [name, setName] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [status, setStatus] = useState<Bot["status"]>("offline");

  async function loadBots() {
    try {
      const response = await fetch("/api/bots");

      if (!response.ok) {
        throw new Error("No se pudieron cargar los bots.");
      }

      const result: {
        ok: boolean;
        data: Bot[];
      } = await response.json();

      setBots(result.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los bots.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCommunities() {
    try {
      const response = await fetch("/api/communities");

      if (!response.ok) {
        throw new Error(
          "No se pudieron cargar las comunidades.",
        );
      }

      const result: {
        ok: boolean;
        data: Community[];
      } = await response.json();

      setCommunities(result.data);

      if (result.data.length > 0) {
        setCommunityId(
          (current) => current || result.data[0].id,
        );
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
      void loadBots();
      void loadCommunities();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function resetForm() {
    setName("");
    setStatus("offline");
    setEditingBot(null);
    setShowForm(false);
    setError(null);
  }

  function handleEdit(bot: Bot) {
    setEditingBot(bot);
    setName(bot.name);
    setCommunityId(bot.community_id);
    setStatus(bot.status);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError("El nombre del bot es obligatorio.");
      return;
    }

    if (!communityId) {
      setError("Debes seleccionar una comunidad.");
      return;
    }

    setError(null);

    if (editingBot) {
      setSaving(true);

      try {
        const response = await fetch(
          `/api/bots/${editingBot.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name.trim(),
              status,
            }),
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ??
              "No se pudo actualizar el bot.",
          );
        }

        resetForm();
        await loadBots();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo actualizar el bot.",
        );
      } finally {
        setSaving(false);
      }

      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/bots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          communityId,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "No se pudo crear el bot.",
        );
      }

      setName("");
      setStatus("offline");
      setShowForm(false);

      await loadBots();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el bot.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(bot: Bot) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${bot.name}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(bot.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/bots/${bot.id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "No se pudo eliminar el bot.",
        );
      }

      setBots((current) =>
        current.filter(
          (item) => item.id !== bot.id,
        ),
      );

      if (editingBot?.id === bot.id) {
        resetForm();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el bot.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function getCommunityName(id: string) {
    return (
      communities.find(
        (community) => community.id === id,
      )?.name ?? "Comunidad desconocida"
    );
  }

  function getStatusLabel(
    botStatus: Bot["status"],
  ) {
    if (botStatus === "online") {
      return "Online";
    }

    if (botStatus === "error") {
      return "Error";
    }

    return "Offline";
  }

  function getStatusVariant(
    botStatus: Bot["status"],
  ): "success" | "danger" | "neutral" {
    if (botStatus === "online") {
      return "success";
    }

    if (botStatus === "error") {
      return "danger";
    }

    return "neutral";
  }

  return (
    <PageBody>
      <PageHeader
        title="Bots"
        description="Administra los bots asociados a tus comunidades."
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
            : "Crear bot"}
        </Button>
      </div>

      {showForm ? (
        <Card
          ariaLabel={
            editingBot
              ? "Editar bot"
              : "Crear bot"
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
              {editingBot
                ? "Editar bot"
                : "Crear bot"}
            </h2>

            <div>
              <label htmlFor="bot-name">
                Nombre
              </label>

              <input
                id="bot-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Ej. Moderador"
                required
                disabled={saving || creating}
              />
            </div>

            <div>
              <label htmlFor="bot-community">
                Comunidad
              </label>

              <select
                id="bot-community"
                value={communityId}
                onChange={(event) =>
                  setCommunityId(
                    event.target.value,
                  )
                }
                required
                disabled={saving || creating}
              >
                <option value="">
                  Selecciona una comunidad
                </option>

                {communities.map(
                  (community) => (
                    <option
                      key={community.id}
                      value={community.id}
                    >
                      {community.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label htmlFor="bot-status">
                Estado
              </label>

              <select
                id="bot-status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as Bot["status"],
                  )
                }
                disabled={saving || creating}
              >
                <option value="offline">
                  Offline
                </option>

                <option value="online">
                  Online
                </option>

                <option value="error">
                  Error
                </option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={creating || saving}
            >
              {editingBot
                ? saving
                  ? "Guardando..."
                  : "Guardar cambios"
                : creating
                  ? "Creando..."
                  : "Crear bot"}
            </Button>
          </form>
        </Card>
      ) : null}

      {error ? (
        <Card ariaLabel="Error de bots">
          <EmptyState
            title="Ocurrió un problema"
            description={error}
          />
        </Card>
      ) : null}

      {loading ? (
        <Card ariaLabel="Cargando bots">
          <EmptyState
            title="Cargando bots"
            description="Estamos consultando los bots disponibles."
          />
        </Card>
      ) : null}

      {!loading &&
      !error &&
      bots.length === 0 ? (
        <Card ariaLabel="Sin bots">
          <EmptyState
            title="Aún no hay bots"
            description="Crea tu primer bot para comenzar a administrarlo."
          />
        </Card>
      ) : null}

      {!loading &&
      bots.length > 0 ? (
        <section
          aria-label="Lista de bots"
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          {bots.map((bot) => (
            <Card
              key={bot.id}
              ariaLabel={bot.name}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2>{bot.name}</h2>

                  <p>
                    Comunidad:{" "}
                    {getCommunityName(
                      bot.community_id,
                    )}
                  </p>

                  <Badge
                    variant={getStatusVariant(
                      bot.status,
                    )}
                  >
                    {getStatusLabel(
                      bot.status,
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
                    onClick={() =>
                      handleEdit(bot)
                    }
                    disabled={
                      deletingId === bot.id
                    }
                  >
                    Editar
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      handleDelete(bot)
                    }
                    disabled={
                      deletingId === bot.id
                    }
                  >
                    {deletingId === bot.id
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
