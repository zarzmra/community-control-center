"use client";

import { MenuIcon } from "@/components/ui/icons";
import { signOut } from "next-auth/react";
import { getActiveNavItem } from "@/lib/navigation";
import styles from "./Topbar.module.css";

type TopbarProps = {
  pathname: string;
  user: {
    name?: string | null;
    email?: string | null;
    role: "admin" | "member";
  };
  menuOpen: boolean;
  onMenuToggle: () => void;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
};

export function Topbar({
  pathname,
  user,
  menuOpen,
  onMenuToggle,
  menuButtonRef,
}: TopbarProps) {
  const current = getActiveNavItem(pathname);

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls="navegacion-principal"
          onClick={onMenuToggle}
        >
          <MenuIcon />
        </button>
        <p className={styles.title}>{current.label}</p>
      </div>

      <div className={styles.right}>
        <p className={styles.status}>
          <span className={styles.statusDot} aria-hidden="true" />
          <span>Sesión activa</span>
        </p>
        <div className={styles.profile} aria-label="Perfil de usuario">
          <span className={styles.avatar} aria-hidden="true">
            {(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
          </span>
          <span className={styles.profileMeta}>
            <span className={styles.profileName}>{user.name ?? user.email}</span>
            <span className={styles.profileHint}>
              {user.role === "admin" ? "Administrador" : "Miembro"}
            </span>
          </span>
        </div>
        <button
          type="button"
          className={styles.signOut}
          onClick={() => void signOut({ callbackUrl: "/login" })}
        >
          Salir
        </button>
      </div>
    </header>
  );
}
