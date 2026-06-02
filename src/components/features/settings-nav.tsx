"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SETTINGS_ITEMS = [
  { href: "/settings/account", label: "Cuenta" },
  { href: "/settings/printers", label: "Impresoras" },
  { href: "/settings/materials", label: "Materiales" },
  { href: "/settings/profiles", label: "Perfiles de impresión" },
  { href: "/settings/storage", label: "Almacenamiento" },
  { href: "/settings/team", label: "Equipo" },
  { href: "/settings/workspace", label: "Espacio de trabajo" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 mt-3 border-b">
      {SETTINGS_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
            pathname.startsWith(item.href)
              ? "border-foreground font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
