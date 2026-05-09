"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Panel" },
  { href: "/orders", label: "Pedidos" },
  { href: "/customers", label: "Clientes" },
  { href: "/models", label: "Modelos" },
  { href: "/settings/printers", label: "Ajustes" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4 border-r min-h-screen w-48 shrink-0">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
        MoshiPrint
      </p>
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-accent text-accent-foreground font-medium"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
