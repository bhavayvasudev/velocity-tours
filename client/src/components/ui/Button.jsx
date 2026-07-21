import { Button as HeroButton, Spinner } from "@heroui/react";

/**
 * App-wide Button. Thin wrapper over HeroUI's Button so call sites get a
 * `loading` prop (maps to HeroUI's `isPending`) instead of hand-rolling
 * spinners everywhere.
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  className = "",
  children,
  ...rest
}) {
  // Soft elevation instead of a heavy drop shadow — only on the primary
  // (accent-filled) variant, since outline/ghost/secondary buttons should
  // stay visually flat until hovered.
  const elevation =
    variant === "primary"
      ? "shadow-[0_2px_8px_-2px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_16px_-4px_rgba(37,99,235,0.45)] transition-shadow"
      : "";

  return (
    <HeroButton
      variant={variant}
      size={size}
      isPending={loading}
      isDisabled={disabled || loading}
      fullWidth={fullWidth}
      className={`${elevation} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size="sm" color="current" /> : Icon ? <Icon size={18} /> : null}
      {children}
    </HeroButton>
  );
}
