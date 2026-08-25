"use client";

import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";
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

export function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function loadCommunities() {
    try {
      setLoading(true);

      const response = await fetch("/api/communities");

      if (!response.ok) {
        throw new Error("No se pudieron cargar las comunidades.");
      }

      const result: {
        ok: boolean;
        data: Community[];
      } = await response.json();

      setCommunities(result.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo conectar con la API de comunidades.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCommunities();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function resetForm() {
    setName("");
    setDescription("");
    setEditingId(null);
  }

  function startCreate() {
    resetForm();
    setError(null);
    setShowForm(true);
  }

  function startEdit(community: Community) {
    setName(community.name);
    setDescription(community.description);
    setEditingId(community.id);
    setError(null);
    setShowForm(true);
  }

  function cancelForm() {
    resetForm();
    setError(null);
    setShowForm(false);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("El nombre de la comunidad es obligatorio.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/communities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "No se pudo crear la comunidad.",
        );
      }

      resetForm();
      setShowForm(false);
      await loadCommunities();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear la comunidad.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId) return;

    if (!name.trim()) {
      setError("El nombre de la comunidad es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/communities/${editingId}`,
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

      const result: {
        ok: boolean;
        data?: Community;
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "No se pudo actualizar la comunidad.",
        );
      }

      if (!result.data) {
        throw new Error(
          "No se recibió la comunidad actualizada.",
        );
      }

      setCommunities((current) =>
        current.map((item) =>
          item.id === result.data!.id ? result.data! : item,
        ),
      );

      resetForm();
      setShowForm(false);
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

  async function handleDelete(community: Community) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${community.name}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    setDeletingId(community.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/communities/${community.id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "No se pudo eliminar la comunidad.",
        );
      }

      setCommunities((current) =>
        current.filter((item) => item.id !== community.id),
      );

      if (editingId === community.id) {
        cancelForm();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la comunidad.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageBody>
      <PageHeader
        title="Comunidades"
        description="Administra las comunidades conectadas al Community Control Center."
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
              cancelForm();
            } else {
              startCreate();
            }
          }}
        >
          {showForm ? "Cancelar" : "Crear comunidad"}
        </Button>
      </div>

      {showForm ? (
        <Card
          ariaLabel={
            editingId
              ? "Editar comunidad"
              : "Crear comunidad"
          }
        >
          <form
            onSubmit={editingId ? handleSave : handleCreate}
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            <h2>
              {editingId
                ? "Editar comunidad"
                : "Nueva comunidad"}
            </h2>

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
                placeholder="Ej. Comunidad Gaming"
                disabled={creating || saving}
                required
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
                placeholder="Describe brevemente la comunidad"
                rows={4}
                disabled={creating || saving}
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
                type="submit"
                disabled={creating || saving}
              >
                {editingId
                  ? saving
                    ? "Guardando..."
                    : "Guardar cambios"
                  : creating
                    ? "Creando..."
                    : "Crear comunidad"}
              </Button>

              {editingId ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelForm}
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
        <Card ariaLabel="Error de comunidades">
          <EmptyState
            title="Ocurrió un problema"
            description={error}
          />
        </Card>
      ) : null}

      {loading ? (
        <Card ariaLabel="Cargando comunidades">
          <EmptyState
            title="Cargando comunidades"
            description="Estamos consultando las comunidades disponibles."
          />
        </Card>
      ) : null}

      {!loading &&
      !error &&
      communities.length === 0 ? (
        <Card ariaLabel="Sin comunidades">
          <EmptyState
            title="Aún no hay comunidades"
            description="Crea tu primera comunidad para comenzar."
          />
        </Card>
      ) : null}

      {!loading && communities.length > 0 ? (
        <section
          aria-label="Lista de comunidades"
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          {communities.map((community) => (
            <Card
              key={community.id}
              ariaLabel={community.name}
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
                  <h2>{community.name}</h2>

                  <p>
                    {community.description ||
                      "Sin descripción."}
                  </p>

                  <Badge
                    variant={
                      community.status === "active"
                        ? "success"
                        : "neutral"
                    }
                  >
                    {community.status === "active"
                      ? "Activa"
                      : "Inactiva"}
                  </Badge>

                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      flexWrap: "wrap",
                      marginTop: "0.75rem",
                    }}
                  >
                    <span>
                      Miembros: {community.members}
                    </span>

                    <span>
                      Bots: {community.bots}
                    </span>

                    <span>
                      Canales: {community.channels}
                    </span>
                  </div>
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
                      startEdit(community)
                    }
                  >
                    Editar
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      handleDelete(community)
                    }
                    disabled={
                      deletingId === community.id
                    }
                  >
                    {deletingId === community.id
                      ? "Eliminando..."
                      : "Eliminar"}
                  </Button>

                  <a
                    href={`/communities/${community.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                    }}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                    >
                      Ver detalles
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </section>
      ) : null}
    </PageBody>
  );
}
