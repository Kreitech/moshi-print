"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Panel" },
  { href: "/orders", label: "Pedidos" },
  { href: "/customers", label: "Clientes" },
  { href: "/models", label: "Modelos" },
  { href: "/products", label: "Productos" },
  { href: "/settings/printers", label: "Ajustes" },
];

export function AppNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => { await signOut(); });
  }

  // Close drawer on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center h-12 px-4 border-b bg-background">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="3" y1="5" x2="17" y2="5" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="15" x2="17" y2="15" />
          </svg>
        </button>
        <span className="ml-3 text-sm font-semibold">MoshiPrint</span>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static in flow on desktop */}
      <nav
        className={`
          fixed top-0 left-0 z-50 h-full w-56 flex flex-col gap-1 p-4 border-r bg-background shadow-lg
          transition-transform duration-200
          md:static md:z-auto md:h-auto md:w-48 md:min-h-screen md:shadow-none md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between mb-2 px-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            MoshiPrint
          </p>
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="md:hidden p-1 rounded-md hover:bg-muted transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14" />
              <line x1="14" y1="2" x2="2" y2="14" />
            </svg>
          </button>
        </div>

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

        <div className="mt-auto pt-4 border-t">
          <button
            onClick={handleSignOut}
            disabled={isPending}
            className="w-full rounded-md px-3 py-2 text-sm text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            {isPending ? "Saliendo..." : "Cerrar sesión"}
          </button>
        </div>
      </nav>
    </>
  );
}
