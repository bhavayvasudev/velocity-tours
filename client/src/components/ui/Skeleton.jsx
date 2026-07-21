import { Skeleton as HeroSkeleton } from "@heroui/react";

export default function Skeleton({ className = "" }) {
  return <HeroSkeleton className={className} />;
}

/**
 * Div-based loading rows for `DataTable`'s card-row layout — mirrors its
 * grid template so skeleton columns line up with the real header/cells.
 */
export function SkeletonRows({ rows = 5, gridTemplate }) {
  const columnCount = gridTemplate ? gridTemplate.split(" ").length : 4;
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid items-center gap-4 rounded-2xl px-5 py-5" style={{ gridTemplateColumns: gridTemplate }}>
          {Array.from({ length: columnCount }).map((__, c) => (
            <Skeleton key={c} className="h-4 w-full rounded-md" />
          ))}
        </div>
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border-subtle)] space-y-4">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-3 w-2/3 rounded-md" />
      <Skeleton className="h-6 w-1/2 rounded-md" />
    </div>
  );
}
