export function deriveStatus(total, paid) {
  if (paid >= total && total > 0) return "paid";
  if (paid > 0) return "partial";
  return "pending";
}
