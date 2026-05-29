import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-md rounded-md border border-line bg-white p-6">
      <h1 className="text-2xl font-semibold">Dev login</h1>
      <p className="mt-2 text-sm text-slate-600">
        MVP authentication uses a fixed development user. Production auth is planned with Microsoft Entra External ID.
      </p>
      <Link
        href="/apps"
        className="mt-5 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
      >
        Continue as dev user
      </Link>
    </div>
  );
}
