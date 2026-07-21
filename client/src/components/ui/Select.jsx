import { Select as HeroSelect, Label, ListBox } from "@heroui/react";

/**
 * `options`: [{ value, label }]. Collapses HeroUI's collection-based Select
 * (Select.Trigger/Value/Indicator/Popover + ListBox.Item) into the plain
 * value/onChange shape the rest of the app already expects from the native
 * <select> it's replacing (period filters, bank/payment-mode pickers...).
 */
export default function Select({ label, options, value, onChange, placeholder = "Select...", className = "" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <Label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">{label}</Label>}
      <HeroSelect
        placeholder={placeholder}
        selectedKey={value ?? null}
        onSelectionChange={(key) => onChange?.(key)}
      >
        {/* Forced to a true stadium pill (HeroUI's default --radius-field
            softens the corners but doesn't clear half the trigger's
            height) — the reference app's selects read as full pills, not
            soft rectangles. */}
        <HeroSelect.Trigger className="!rounded-full !border-[var(--color-border-subtle)] !bg-[var(--color-surface)] !pl-4 !shadow-none">
          <HeroSelect.Value />
          <HeroSelect.Indicator />
        </HeroSelect.Trigger>
        <HeroSelect.Popover>
          <ListBox>
            {options.map((opt) => (
              <ListBox.Item key={opt.value} id={opt.value} textValue={String(opt.label)}>
                {opt.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </HeroSelect.Popover>
      </HeroSelect>
    </div>
  );
}
