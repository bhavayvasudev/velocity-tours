import { useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

/**
 * Centered floating pill navigation — the app shell's only navigation
 * surface (no sidebar). The active indicator is a single measured span
 * (offset/width read from the active link's DOM node) animated with a CSS
 * transition, rather than framer-motion's layoutId shared-element approach
 * — layoutId's projection math doesn't play well nested inside a `sticky`
 * header and was leaving the indicator stuck at opacity 0.
 *
 * `items` are plain nav links by default. One item may carry `type: "cta"`
 * (e.g. "New Booking") to render as a highlighted, always-labeled pill at
 * the trailing edge of the same capsule — the primary action living inside
 * the single floating nav object instead of a separate button next to it.
 */
export default function PillNav({ items }) {
  const containerRef = useRef(null);
  const linkRefs = useRef(new Map());
  const location = useLocation();
  const navigate = useNavigate();
  const [indicator, setIndicator] = useState(null);

  const navItems = items.filter((item) => item.type !== "cta");
  const ctaItem = items.find((item) => item.type === "cta");

  const isItemActive = (item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);

  useLayoutEffect(() => {
    const measure = () => {
      const activeItem = navItems.find(isItemActive);
      const container = containerRef.current;
      const el = activeItem && linkRefs.current.get(activeItem.path);
      if (!container || !el) { setIndicator(null); return; }
      const containerRect = container.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      setIndicator({ left: rect.left - containerRect.left + container.scrollLeft, width: rect.width });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, items]);

  return (
    <nav
      ref={containerRef}
      aria-label="Primary"
      className="pointer-events-auto relative flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/90 p-1.5 shadow-[var(--shadow-soft)] backdrop-blur-xl no-scrollbar"
    >
      {indicator && (
        <span
          className="nav-pill-indicator absolute top-1.5 h-9 rounded-full bg-blue-600 shadow-[0_4px_14px_-2px_rgba(37,99,235,0.5)]"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}

      {navItems.map((item) => {
        const active = isItemActive(item);
        return (
          <NavLink
            key={item.path}
            ref={(el) => {
              if (el) linkRefs.current.set(item.path, el);
              else linkRefs.current.delete(item.path);
            }}
            to={item.path}
            end={item.end}
            className="group relative z-10 shrink-0 rounded-full text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span className="relative flex items-center gap-1.5 px-3.5 py-2">
              <item.icon
                size={16}
                className={`shrink-0 ${
                  active ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white"
                }`}
              />
              <span
                className={`hidden lg:inline ${
                  active ? "text-white" : "text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white"
                }`}
              >
                {item.name}
              </span>
            </span>
          </NavLink>
        );
      })}

      {ctaItem && (
        <button
          type="button"
          onClick={() => navigate(ctaItem.path, ctaItem.state ? { state: ctaItem.state } : undefined)}
          className="relative z-10 ml-0.5 shrink-0 whitespace-nowrap rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_-2px_rgba(37,99,235,0.5)] transition-colors hover:bg-blue-700">
            <ctaItem.icon size={16} className="shrink-0" />
            <span>{ctaItem.name}</span>
          </span>
        </button>
      )}
    </nav>
  );
}
