"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { createCustomerQuick } from "@/lib/actions/customers";
import { type Customer } from "@/types/database";

export function CustomerCombobox({
  customers,
  initialCustomer,
}: {
  customers: Customer[];
  initialCustomer?: { id: string; name: string } | null;
}) {
  const [query, setQuery] = useState(initialCustomer?.name ?? "");
  const [selectedId, setSelectedId] = useState(initialCustomer?.id ?? "");
  const [selectedName, setSelectedName] = useState(initialCustomer?.name ?? "");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length === 0
    ? customers.slice(0, 3)
    : customers.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6);

  const exactMatch = filtered.some(
    (c) => c.name.toLowerCase() === query.trim().toLowerCase()
  );
  const showCreate = query.trim().length >= 2 && !exactMatch;

  function select(c: { id: string; name: string }) {
    setSelectedId(c.id);
    setSelectedName(c.name);
    setQuery(c.name);
    setOpen(false);
    setCreateError(null);
  }

  function handleCreate() {
    setCreateError(null);
    startTransition(async () => {
      const result = await createCustomerQuick(query.trim());
      if ("error" in result && result.error) {
        setCreateError(result.error);
      } else if ("id" in result && result.id) {
        select({ id: result.id, name: result.name! });
      }
    });
  }

  // Close dropdown on outside click; restore display name if user typed without selecting
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        if (selectedName && query !== selectedName) setQuery(selectedName);
        else if (!selectedName) setQuery("");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [query, selectedName]);

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name="customer_id" value={selectedId} />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId("");
          setSelectedName("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar o crear cliente..."
        autoComplete="off"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {open && (filtered.length > 0 || showCreate) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(c)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
            >
              {c.name}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCreate}
              disabled={isPending}
              className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-muted transition-colors border-t disabled:opacity-50"
            >
              {isPending ? "Creando..." : `+ Crear "${query.trim()}"`}
            </button>
          )}
        </div>
      )}
      {createError && (
        <p className="mt-1 text-xs text-destructive">{createError}</p>
      )}
    </div>
  );
}
