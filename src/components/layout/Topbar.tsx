import { MenuIcon } from "@/components/ui/icons";
import { getActiveNavItem } from "@/lib/navigation";
import styles from "./Topbar.module.css";

type TopbarProps = {
  pathname: string;
  menuOpen: boolean;
  onMenuToggle: () => void;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
};

export function Topbar({
  pathname,
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
          <span>Sistema: Sin conectar</span>
        </p>
        <div className={styles.profile} aria-label="Perfil de usuario">
          <span className={styles.avatar} aria-hidden="true">
            U
          </span>
          <span className={styles.profileMeta}>
            <span className={styles.profileName}>Usuario</span>
            <span className={styles.profileHint}>Sin sesión</span>
          </span>
        </div>
      </div>
    </header>
  );
}
