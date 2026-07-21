import { Dropdown as HeroDropdown, Label } from "@heroui/react";

/**
 * `items`: [{ key, label, icon: Icon, description, danger, onSelect }]
 * Collapses HeroUI's Dropdown.Trigger(implicit)/Popover/Menu/Item into a
 * single `trigger + items` API for menus like the Bookings export button
 * and the sidebar user menu.
 */
export default function Dropdown({ trigger, items, align = "end" }) {
  const byKey = Object.fromEntries(items.map((item) => [item.key, item]));

  return (
    <HeroDropdown>
      {trigger}
      <HeroDropdown.Popover placement={align === "end" ? "bottom end" : "bottom start"}>
        <HeroDropdown.Menu onAction={(key) => byKey[key]?.onSelect?.()}>
          {items.map((item) => (
            <HeroDropdown.Item
              key={item.key}
              id={item.key}
              textValue={item.label}
              variant={item.danger ? "danger" : "default"}
            >
              <div className="flex items-center gap-3">
                {item.icon && <item.icon size={16} />}
                <div>
                  <Label>{item.label}</Label>
                  {item.description && (
                    <p className="text-xs text-[var(--color-text-muted)]">{item.description}</p>
                  )}
                </div>
              </div>
            </HeroDropdown.Item>
          ))}
        </HeroDropdown.Menu>
      </HeroDropdown.Popover>
    </HeroDropdown>
  );
}
