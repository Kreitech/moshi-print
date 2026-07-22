"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  generateListingDraft,
  updateListingStatus,
  setListingExternalUrl,
} from "@/lib/actions/products";
import { type ChannelListing, type SalesChannelProvider } from "@/types/database";

const PROVIDER_OPTIONS: { value: SalesChannelProvider; label: string }[] = [
  { value: "mercadolibre", label: "MercadoLibre" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook Marketplace" },
  { value: "etsy", label: "Etsy" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "manual", label: "Manual" },
];

const PROVIDER_LABELS: Record<string, string> = Object.fromEntries(
  PROVIDER_OPTIONS.map((o) => [o.value, o.label])
);

const LISTING_STATUS_LABELS: Record<ChannelListing["status"], string> = {
  draft: "Borrador",
  published: "Publicado",
  paused: "Pausado",
  error: "Error",
};

function ListingCard({
  listing,
  productId,
}: {
  listing: ChannelListing;
  productId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateListingStatus(listing.id, status, productId);
    });
  }

  function handleUrlSubmit(formData: FormData) {
    setUrlError(null);
    startTransition(async () => {
      const result = await setListingExternalUrl(listing.id, productId, formData);
      if (result?.error) setUrlError(result.error);
    });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(`${listing.title}\n\n${listing.description}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tags = Array.isArray(listing.suggested_tags)
    ? (listing.suggested_tags as string[])
    : [];
  const photoChecklist = Array.isArray(listing.photo_checklist)
    ? (listing.photo_checklist as string[])
    : [];

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {PROVIDER_LABELS[listing.provider] ?? listing.provider}
        </span>
        <select
          value={listing.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isPending}
          className="flex h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm"
        >
          {Object.entries(LISTING_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">{listing.title}</p>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {listing.description}
        </p>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="rounded bg-muted px-2 py-0.5 text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      {photoChecklist.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Checklist de fotos ({photoChecklist.length})
          </summary>
          <ul className="mt-1 list-disc pl-4 space-y-0.5">
            {photoChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? "Copiado!" : "Copiar texto"}
        </Button>
        {listing.external_url && (
          <a
            href={listing.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Ver publicación externa
          </a>
        )}
      </div>

      <form action={handleUrlSubmit} className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">URL externa (tras publicar manualmente)</Label>
          <Input
            name="external_url"
            type="url"
            defaultValue={listing.external_url ?? ""}
            placeholder="https://..."
            className="h-8 text-sm"
          />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          Guardar
        </Button>
      </form>
      {urlError && <p className="text-xs text-destructive">{urlError}</p>}
    </div>
  );
}

export function ListingDraftsSection({
  productId,
  listings,
  licenseWarning,
}: {
  productId: string;
  listings: ChannelListing[];
  licenseWarning: string | null;
}) {
  const [provider, setProvider] = useState<SalesChannelProvider>("mercadolibre");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateListingDraft(productId, provider);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Borradores de publicación</h2>

      {licenseWarning && (
        <p className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          {licenseWarning}
        </p>
      )}

      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Canal</Label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as SalesChannelProvider)}
            className="flex h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
          >
            {PROVIDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" size="sm" onClick={handleGenerate} disabled={isPending}>
          {isPending ? "Generando..." : "Generar borrador de publicación"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {listings.length > 0 ? (
        <div className="space-y-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} productId={productId} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin borradores generados todavía.</p>
      )}
    </section>
  );
}
