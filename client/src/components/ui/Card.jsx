const SIZE_STYLES = {
  lg: "rounded-[28px] p-6 md:p-7 shadow-[var(--shadow-soft)]",
  md: "rounded-2xl p-6 shadow-[var(--shadow-soft)]",
  sm: "rounded-xl p-4 shadow-none",
};

/**
 * Shared card surface — three deliberate size tiers (lg/md/sm) instead of
 * every panel reaching for the same radius/shadow, so hierarchy reads from
 * the shape of the page, not just its content.
 */
export default function Card({ size = "md", hover = false, className = "", children, ...rest }) {
  return (
    <div
      className={`border border-[var(--color-border-subtle)] bg-[var(--color-surface)] transition-shadow duration-200 ${SIZE_STYLES[size] || SIZE_STYLES.md} ${
        hover ? "hover:shadow-[var(--shadow-soft-lg)]" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...rest }) {
  return (
    <div className={`mb-4 flex items-center justify-between gap-3 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...rest }) {
  return (
    <h3 className={`text-sm font-bold text-slate-800 dark:text-white ${className}`} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = "", children, ...rest }) {
  return (
    <p className={`mt-0.5 text-xs text-[var(--color-text-muted)] ${className}`} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...rest }) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...rest }) {
  return (
    <div className={`mt-4 flex items-center gap-3 ${className}`} {...rest}>
      {children}
    </div>
  );
}
