"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import styles from "./LoginForm.module.css";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    
    try {
      const result = await signIn("credentials", {
        email: data.get("email") as string,
        password: data.get("password") as string,
        redirect: false,
      });
      
      if (!result?.ok) {
        setError("Correo o contraseña incorrectos.");
        setPending(false);
        return;
      }

      // Redirigir al dashboard
      window.location.assign("/");
    } catch (err) {
      setError("Error al iniciar sesión. Inténtalo de nuevo.");
      setPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor="email">Correo electrónico</label>
      <input 
        id="email" 
        name="email" 
        type="email" 
        autoComplete="email" 
        required 
        disabled={pending} 
      />
      <label htmlFor="password">Contraseña</label>
      <input 
        id="password" 
        name="password" 
        type="password" 
        autoComplete="current-password" 
        required 
        disabled={pending} 
      />
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Comprobando…" : "Entrar"}
      </button>
    </form>
  );
}
