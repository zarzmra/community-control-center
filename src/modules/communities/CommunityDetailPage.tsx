"use client";

import { FormEvent, useEffect, useState } from "react";
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

type CommunityDetailPageProps = {
  id: string;
};

export function CommunityDetailPage({
  id,
}: CommunityDetailPageProps) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(false);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchCommunity() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/communities/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("La comunidad no existe.");
          }

          throw new Error(
            "No se pudo cargar la información de la comunidad.",
          );
        }

        const result: {
          ok: boolean;
          data: Community;
        } = await response.json();

        if (!cancelled) {
          setCommunity(result.data);
          setName(result.data.name);
          setDescription(result.data.description);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo conectar con la API de comunidades.",
          );
          setLoading(false);
        }
      }
    }

    fetchCommunity();

    return () => {
      cancelled = true;
    };
  }, [id, retry]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("El nombre de la comunidad es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/communities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription,
        }),
      });

      const result: {
        ok: boolean;
        data?: Community;
        error?: string;
      } = await response.json();

      if (!response.ok || !result.data) {
        throw new Error(
          result.error ?? "No se pudo actualizar la comunidad.",
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

  if (loading) {
    return (
      <PageBody>
        <PageHeader title="Cargando comunidad" />

        <Card ariaLabel="Cargando detalles">
          <LoadingState label="Consultando los detalles de la comunidad..." />
        </Card>
      </PageBody>
    );
  }

  if (error || !community) {
    return (
      <PageBody>
        <PageHeader title="Detalle de Comunidad" />

        <Card ariaLabel="Error de carga">
          <ErrorState
            title="Ocurrió un problema"
            description={error || "Comunidad no encontrada."}
            onRetry={() => {
              setRetry((value) => !value);
            }}
          />

          <div style={{ marginTop: "1rem" }}>
            <Button href="/communities" variant="secondary">
              Volver a comunidades
            </Button>
          </div>
        </Card>
      </PageBody>
    );
  }

  return (
    <PageBody>
      <PageHeader
        title={community.name}
        description="Administra la información y consulta las estadísticas de la comunidad."
      />

      {error ? (
        <Card ariaLabel="Error">
          <ErrorState
            title="No se pudo guardar"
            description={error}
            onRetry={() => setError(null)}
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
        {editing ? (
          <Card ariaLabel="Editar comunidad">
            <form
              onSubmit={handleSave}
              style={{
                display: "grid",
                gap: "1rem",
              }}
            >
              <h2>Editar comunidad</h2>

              <div>
                <label htmlFor="community-name">
                  Nombre
                </label>

                <input
                  id="community-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nombre de la comunidad"
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
                  placeholder="Descripción de la comunidad"
                  rows={4}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setName(community.name);
                    setDescription(community.description);
                    setError(null);
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Card>
        ) : (
          <Card ariaLabel="Información de la comunidad">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "1rem",
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
                    color: "var(--color-text-secondary, #666)",
                    marginBottom: "1rem",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {community.description ||
                    "Sin descripción disponible."}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                    }}
                  >
                    Estado:
                  </span>

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
              </div>

              <button
                type="button"
                onClick={() => {
                  setName(community.name);
                  setDescription(community.description);
                  setError(null);
                  setEditing(true);
                }}
              >
                Editar comunidad
              </button>
            </div>
          </Card>
        )}

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

              <span
                style={{
                  color: "var(--color-text-secondary, #666)",
                  fontSize: "0.875rem",
                }}
              >
                Miembros
              </span>
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

              <span
                style={{
                  color: "var(--color-text-secondary, #666)",
                  fontSize: "0.875rem",
                }}
              >
                Bots Conectados
              </span>
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

              <span
                style={{
                  color: "var(--color-text-secondary, #666)",
                  fontSize: "0.875rem",
                }}
              >
                Canales de Comunicación
              </span>
            </div>
          </Card>
        </section>

        <div>
          <Button href="/communities" variant="secondary">
            Volver a comunidades
          </Button>
        </div>
      </div>
    </PageBody>
  );
}
