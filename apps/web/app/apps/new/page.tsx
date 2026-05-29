import { CreateAppForm } from "@/components/CreateAppForm";

export default function NewAppPage() {
  return (
    <div className="space-y-5">
      <div className="mb-5">
        <h1 className="text-3xl font-semibold text-ink">New application</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Create the workspace first. The app can be versioned and checked before any runtime variables are configured.
        </p>
      </div>
      <CreateAppForm />
    </div>
  );
}
