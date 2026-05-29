import { AppsClient } from "@/components/AppsClient";

export default function AppsPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Applications</h1>
        <p className="mt-1 text-sm text-slate-600">Create, version, analyze and govern application snapshots.</p>
      </div>
      <AppsClient />
    </div>
  );
}
