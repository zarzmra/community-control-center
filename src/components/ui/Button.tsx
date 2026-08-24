import Link from "next/link";
import { cx } from "@/lib/cx";
import type { AppPath } from "@/types";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost";

type CommonProps = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  ariaLabel?: string;
};

type ButtonAsButton = CommonProps & {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
  ariaExpanded?: boolean;
  ariaControls?: string;
};

type ButtonAsLink = CommonProps & {
  href: AppPath;
  type?: never;
  onClick?: never;
  ariaExpanded?: never;
  ariaControls?: never;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const className = cx(
    styles.button,
    styles[props.variant ?? "primary"],
    props.className,
  );

  if (props.href) {
    return (
      <Link href={props.href} className={className} aria-label={props.ariaLabel}>
        {props.children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      className={className}
      onClick={props.onClick}
      aria-label={props.ariaLabel}
      aria-expanded={props.ariaExpanded}
      aria-controls={props.ariaControls}
    >
      {props.children}
    </button>
  );
}
