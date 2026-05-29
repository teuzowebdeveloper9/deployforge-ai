import { CreateAppForm } from "@/components/CreateAppForm";

export default function NewAppPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Create application</h1>
        <p className="mt-1 text-sm text-slate-600">The MVP uses dev auth and creates metadata through the Core API.</p>
      </div>
      <CreateAppForm />
    </div>
  );
}
