import { LoginForm } from "@/components/auth/LoginForm";
import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <section className={styles.card} aria-labelledby="login-title">
        <p className={styles.eyebrow}>CCC</p>
        <h1 id="login-title">Inicia sesión</h1>
        <p className={styles.description}>
          Accede al panel de administración de Community Control Center.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
