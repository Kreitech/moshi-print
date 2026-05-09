"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Customer } from "@/types/database";

export function CustomerList({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (customers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aún no hay clientes. Crea el primero.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Teléfono</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <Link
                  href={`/customers/${customer.id}`}
                  className="font-medium hover:underline"
                >
                  {customer.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {customer.email ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {customer.phone ?? "—"}
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground"
              >
                Sin resultados para &ldquo;{search}&rdquo;
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
