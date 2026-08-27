"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { SkipLink } from "@/components/layout/SkipLink";
import { Topbar } from "@/components/layout/Topbar";
import styles from "./AppShell.module.css";

const DESKTOP_QUERY = "(min-width: 768px)";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: "admin" | "member";
  };
};

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => {
      if (media.matches) {
        setMobileNavOpen(false);
      }
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const sidebar = sidebarRef.current;
    const menuButton = menuButtonRef.current;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileNavOpen(false);
        return;
      }

      if (event.key !== "Tab" || !sidebar) {
        return;
      }

      const focusable = sidebar.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (!window.matchMedia(DESKTOP_QUERY).matches) {
        menuButton?.focus();
      }
    };
  }, [mobileNavOpen]);

  return (
    <div className={styles.shell}>
      <SkipLink />
      <Sidebar
        open={mobileNavOpen}
        pathname={pathname}
        onClose={closeMobileNav}
        closeButtonRef={closeButtonRef}
        sidebarRef={sidebarRef}
      />
      <div className={styles.body}>
        <Topbar
          pathname={pathname}
          user={user}
          menuOpen={mobileNavOpen}
          onMenuToggle={() => setMobileNavOpen((open) => !open)}
          menuButtonRef={menuButtonRef}
        />
        <main
          id="contenido-principal"
          className={styles.main}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
