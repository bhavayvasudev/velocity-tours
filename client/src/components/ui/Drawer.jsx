import { Drawer as HeroDrawer } from "@heroui/react";

/**
 * Simplified wrapper over HeroUI's Drawer compound structure, mirroring
 * ui/Dialog.jsx's ergonomic API. Used for mobile nav and slide-over detail
 * panels (e.g. vendor quick-view).
 */
export default function Drawer({
  open,
  onOpenChange,
  placement = "right",
  title,
  footer,
  children,
}) {
  return (
    <HeroDrawer.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <HeroDrawer.Content placement={placement}>
        <HeroDrawer.Dialog>
          <HeroDrawer.CloseTrigger />
          {title && (
            <HeroDrawer.Header>
              <HeroDrawer.Heading>{title}</HeroDrawer.Heading>
            </HeroDrawer.Header>
          )}
          <HeroDrawer.Body>{children}</HeroDrawer.Body>
          {footer && <HeroDrawer.Footer>{footer}</HeroDrawer.Footer>}
        </HeroDrawer.Dialog>
      </HeroDrawer.Content>
    </HeroDrawer.Backdrop>
  );
}
