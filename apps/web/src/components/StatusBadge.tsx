const styles: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  CREATED: "bg-sky-50 text-sky-800 border-sky-200",
  RUNNING: "bg-amber-50 text-amber-800 border-amber-200",
  PASSED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  FAILED: "bg-rose-50 text-rose-800 border-rose-200"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${styles[status] ?? "border-line bg-white"}`}>
      {status}
    </span>
  );
}
