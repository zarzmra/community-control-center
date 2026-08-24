import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Página no encontrada</h1>
      <p className={styles.description}>
        La ruta solicitada no existe en Community Control Center.
      </p>
      <Button href="/">Volver al dashboard</Button>
    </div>
  );
}
