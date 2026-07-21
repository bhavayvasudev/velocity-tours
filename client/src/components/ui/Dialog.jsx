import { Modal } from "@heroui/react";

/**
 * Collapses HeroUI's Modal.Backdrop/Container/Dialog/Header/Body/Footer
 * compound structure into a single ergonomic component, since every
 * create/edit form in this app (New Trip, Add Expense, Add Vendor Bill,
 * Add Cash Entry...) needs the same open/title/body/footer shape.
 */
export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  footer,
  children,
}) {
  const sizeClass = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-lg", xl: "sm:max-w-2xl" }[size];

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className={sizeClass}>
          <Modal.CloseTrigger />
          {title && (
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
              {description && <p className="text-sm text-[var(--color-text-muted)]">{description}</p>}
            </Modal.Header>
          )}
          <Modal.Body>{children}</Modal.Body>
          {footer && <Modal.Footer>{footer}</Modal.Footer>}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
