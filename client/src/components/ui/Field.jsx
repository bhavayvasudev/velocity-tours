import { Input as HeroInput, TextArea as HeroTextArea, Label } from "@heroui/react";

/**
 * Form-field wrappers driven by plain props (not React Aria's isInvalid/
 * FieldError context) so they slot straight into React Hook Form's
 * `register()` / `Controller` without extra glue: value+onChange in,
 * error string out, styled consistently either way.
 */
export function TextInput({ label, error, hint, className = "", inputClassName = "", ...rest }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <Label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">{label}</Label>}
      <HeroInput fullWidth aria-label={label} className={inputClassName} {...rest} />
      {hint && !error && <p className="text-[11px] text-[var(--color-text-muted)]">{hint}</p>}
      {error && <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}

export function TextAreaField({ label, error, hint, className = "", ...rest }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <Label className="text-xs font-bold text-[var(--color-text-muted)] uppercase">{label}</Label>}
      <HeroTextArea fullWidth aria-label={label} {...rest} />
      {hint && !error && <p className="text-[11px] text-[var(--color-text-muted)]">{hint}</p>}
      {error && <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
