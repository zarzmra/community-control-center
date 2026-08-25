"use client";

import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Card } from "@/components/ui/Card";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";

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
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchCommunities() {
      try {
        const response = await fetch("/api/communities");

        if (!response.ok) {
          throw new Error("No se pudieron cargar las comunidades.");
        }

        const result: {
          ok: boolean;
          data: Community[];
        } = await response.json();

        if (!cancelled) {
          setCommunities(result.data);
          setError(null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("No se pudo conectar con la API de comunidades.");
          setLoading(false);
        }
      }
    }

    fetchCommunities();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadCommunities() {
    try {
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
    } catch {
      setError("No se pudo conectar con la API de comunidades.");
    }
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

      setName("");
      setDescription("");
      setShowForm(false);

      await loadCommunities();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo crear la comunidad.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(community: Community) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${community.name}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(community.id);
    setError(null);

    try {
      const response = await fetch("/api/communities", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: community.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "No se pudo eliminar la comunidad.",
        );
      }

      setCommunities((current) =>
        current.filter((item) => item.id !== community.id),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
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
        <button
          type="button"
          onClick={() => setShowForm((visible) => !visible)}
        >
          {showForm ? "Cancelar" : "Crear comunidad"}
        </button>
      </div>

      {showForm ? (
        <Card ariaLabel="Crear comunidad">
          <form
            onSubmit={handleCreate}
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
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Comunidad Gaming"
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
              />
            </div>

            <button type="submit" disabled={creating}>
              {creating ? "Creando..." : "Crear comunidad"}
            </button>
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

      {!loading && !error && communities.length === 0 ? (
        <Card ariaLabel="Sin comunidades">
          <EmptyState
            title="Aún no hay comunidades"
            description="Todavía no hay comunidades registradas."
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
              <h2>{community.name}</h2>

              <p>
                {community.description || "Sin descripción."}
              </p>

              <p>
                Estado: {community.status}
              </p>

              <p>
                Miembros: {community.members}
              </p>

              <p>
                Bots: {community.bots}
              </p>

              <p>
                Canales: {community.channels}
              </p>

              <button
                type="button"
                onClick={() => handleDelete(community)}
                disabled={deletingId === community.id}
              >
                {deletingId === community.id
                  ? "Eliminando..."
                  : "Eliminar comunidad"}
              </button>
            </Card>
          ))}
        </section>
      ) : null}
    </PageBody>
  );
}
