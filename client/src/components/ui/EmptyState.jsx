import { EmptyState as HeroEmptyState } from "@heroui/react";

export default function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <HeroEmptyState className={`py-16 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center mb-4 mx-auto text-[var(--color-text-muted)]">
          <Icon size={28} />
        </div>
      )}
      <p className="text-lg font-semibold text-center">{title}</p>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] text-center mt-1">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </HeroEmptyState>
  );
}
