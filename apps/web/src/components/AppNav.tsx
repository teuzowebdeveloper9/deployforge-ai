import Link from "next/link";

export function AppNav({ appId }: { appId: string }) {
  const items = [
    { href: `/apps/${appId}`, label: "Overview" },
    { href: `/apps/${appId}/versions`, label: "Versions" },
    { href: `/apps/${appId}/builds`, label: "Builds" },
    { href: `/apps/${appId}/agent`, label: "Agent" }
  ];

  return (
    <nav className="mb-5 flex flex-wrap gap-2 border-b border-line pb-3 text-sm">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-3 py-2 font-medium text-muted hover:bg-surface hover:text-ink"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
