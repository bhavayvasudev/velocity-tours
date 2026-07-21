// Renders the raw `badge`/`badge--*` utility classes from @heroui/styles
// directly instead of going through @heroui/react's <Badge>, because that
// component always applies a `placement` variant (default "top-right") that
// forces `position: absolute`. It's built for notification dots anchored to
// an avatar/icon, not standalone status pills, and with no positioned
// ancestor it escapes to the viewport's top-right corner. Using the static
// classes keeps the identical look while staying in normal flex/grid flow.
const SIZE_CLASS = { sm: "badge--sm", md: "badge--md", lg: "badge--lg" };
const VARIANT_CLASS = { primary: "badge--primary", secondary: "badge--secondary", soft: "badge--soft" };
const COLOR_CLASS = { accent: "badge--accent", default: "badge--default", success: "badge--success", warning: "badge--warning", danger: "badge--danger" };

export default function Badge({ color = "default", variant = "soft", size = "md", className = "", children, ...rest }) {
  const classes = ["badge", "whitespace-nowrap", SIZE_CLASS[size], VARIANT_CLASS[variant], COLOR_CLASS[color], className]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes} {...rest}>
      <span className="badge__label">{children}</span>
    </span>
  );
}

/**
 * Maps every status word used across the app — payment status
 * ("paid" | "partial" | "pending" | "overdue") and booking lifecycle
 * ("confirmed" | "completed" | "cancelled") — to a consistent Badge look,
 * so every module renders status the same way instead of each screen
 * inventing its own color logic.
 */
const STATUS_STYLES = {
  paid: { color: "success", label: "Paid" },
  partial: { color: "warning", label: "Partial" },
  pending: { color: "default", label: "Pending" },
  overdue: { color: "danger", label: "Overdue" },
  confirmed: { color: "accent", label: "Confirmed" },
  completed: { color: "success", label: "Completed" },
  cancelled: { color: "danger", label: "Cancelled" },
};

export function StatusBadge({ status, className = "" }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <Badge color={style.color} variant="soft" className={className}>
      {style.label}
    </Badge>
  );
}
