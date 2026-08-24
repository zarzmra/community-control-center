import styles from "./PageHeader.module.css";

type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
    </header>
  );
}

type PageBodyProps = {
  children: React.ReactNode;
};

export function PageBody({ children }: PageBodyProps) {
  return <div className={styles.page}>{children}</div>;
}
