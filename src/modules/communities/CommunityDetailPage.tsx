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

type CommunityDetailPageProps = {
  id: string;
};

export function CommunityDetailPage({
  id,
}: CommunityDetailPageProps) {
  const router = useRouter();

  const [community, setCommunity] =
    useState<Community | null>(null);

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

    async function fetchCommunity() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/communities/${id}`,
        );

        const result: {
          ok: boolean;
          data?: Community;
          error?: string;
        } = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ??
              "No se pudo cargar la comunidad.",
          );
        }

        if (!result.data) {
          throw new Error(
            "No se recibió información de la comunidad.",
          );
        }

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
              : "No se pudo conectar con la API.",
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

      const result: {
        ok: boolean;
        data?: Community;
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "No se pudo actualizar la comunidad.",
        );
      }

      if (!result.data) {
        throw new Error(
          "No se recibió la comunidad actualizada.",
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
    if (!community) {
      return;
    }

    setName(community.name);
    setDescription(community.description);
    setError(null);
    setEditing(false);
  }

  async function handleDelete() {
    if (!community) {
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${community.name}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

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

      const result: {
        ok: boolean;
        error?: string;
      } = await response.json();

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
            label="Consultando los detalles de la comunidad..."
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
            onRetry={() => {
              setRetry((value) => !value);
            }}
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

  if (!community) {
    return null;
  }

  return (
    <PageBody>
      <PageHeader
        title={community.name}
        description="Administra la información y configuración de esta comunidad."
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
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>

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
                    setError(null);
                    setEditing(true);
                  }}
                >
                  Editar
                </button>
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

              <span
                style={{
                  color:
                    "var(--color-text-secondary, #666)",
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
                  color:
                    "var(--color-text-secondary, #666)",
                  fontSize: "0.875rem",
                }}
              >
                Bots conectados
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
                  color:
                    "var(--color-text-secondary, #666)",
                  fontSize: "0.875rem",
                }}
              >
                Canales
              </span>
            </div>
          </Card>
        </section>

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

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting
                ? "Eliminando..."
                : "Eliminar comunidad"}
            </button>
          </div>
        </Card>
      </div>
    </PageBody>
  );
}
