import type { ProductVariant, SalesChannelProvider, SellableProduct } from "@/types/database";

export type DraftContent = {
  title: string;
  description: string;
  suggested_tags: string[];
  photo_checklist: string[];
};

function formatPrice(amount: number | null, currency: string | null): string {
  if (amount == null) return "Consultar";
  return `${amount.toLocaleString("es-UY", { minimumFractionDigits: 2 })} ${currency ?? "UYU"}`;
}

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function uniqueValues(variants: ProductVariant[], key: "color" | "size" | "material"): string[] {
  return Array.from(new Set(variants.map((v) => v[key]).filter((v): v is string => !!v)));
}

const BASE_PHOTO_CHECKLIST = [
  "Foto frontal con buena luz natural, fondo neutro",
  "Foto de detalle/textura de la superficie",
  "Foto con un objeto de referencia para mostrar la escala",
];

export function buildListingDraft(
  provider: SalesChannelProvider,
  product: SellableProduct,
  variants: ProductVariant[]
): DraftContent {
  const price = formatPrice(product.base_price_amount, product.base_price_currency);
  const colors = uniqueValues(variants, "color");
  const materials = uniqueValues(variants, "material");
  const leadTime =
    product.lead_time_days != null ? `${product.lead_time_days} días hábiles` : "a confirmar";
  const customizable = variants.length > 0;
  const baseDescription = product.description?.trim() || product.name;

  switch (provider) {
    case "mercadolibre": {
      const title = materials.length > 0 ? `${product.name} - ${materials[0]}` : product.name;
      const lines = [
        baseDescription,
        "",
        `Material: ${materials.length > 0 ? materials.join(", ") : "consultar"}`,
        `Personalizable: ${customizable ? "sí, colores y variantes a elección" : "no"}`,
        `Tiempo de entrega: ${leadTime}`,
        "Incluye: pieza impresa en 3D según la especificación del producto.",
        "No incluye: envío (a coordinar por separado, salvo que se indique lo contrario).",
      ];
      return {
        title,
        description: lines.join("\n"),
        suggested_tags: ["impresion 3d", "3d printing", product.name, ...materials],
        photo_checklist: [
          ...BASE_PHOTO_CHECKLIST,
          "Foto con medidas/dimensiones visibles",
        ],
      };
    }
    case "instagram": {
      const hashtags = [
        "#impresion3d",
        "#3dprinting",
        "#hechoenuruguay",
        `#${slug(product.name)}`,
      ];
      const description = [
        `✨ ${product.name} ✨`,
        baseDescription,
        `💰 Precio desde ${price}`,
        "📩 Escribinos para personalizar tu pedido!",
        "",
        hashtags.join(" "),
      ].join("\n");
      return {
        title: product.name,
        description,
        suggested_tags: hashtags,
        photo_checklist: [
          ...BASE_PHOTO_CHECKLIST,
          "Foto tipo 'lifestyle' mostrando el producto en uso",
        ],
      };
    }
    case "facebook": {
      const description = [
        `${product.name} — ${price}`,
        baseDescription,
        "Entrega en persona a coordinar, o envío.",
        colors.length > 0 ? `Colores disponibles: ${colors.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      return {
        title: `${product.name} - ${price}`,
        description,
        suggested_tags: ["impresion 3d", product.name],
        photo_checklist: BASE_PHOTO_CHECKLIST,
      };
    }
    case "etsy": {
      const description = [
        `${product.name} — pieza impresa en 3D, ideal para regalar.`,
        baseDescription,
        `Tiempo de entrega: ${leadTime}.`,
        customizable ? "Personalizable en color y variantes." : "",
      ]
        .filter(Boolean)
        .join("\n");
      return {
        title: `${product.name} - regalo personalizado impreso en 3D`,
        description,
        suggested_tags: ["3d printed gift", "custom gift", "impresion 3d"],
        photo_checklist: [
          ...BASE_PHOTO_CHECKLIST,
          "Foto de regalo envuelto o presentado, si aplica",
        ],
      };
    }
    case "whatsapp": {
      const description = [
        `Hola! Te comparto info de *${product.name}*:`,
        `💰 Precio: ${price}`,
        colors.length > 0 ? `🎨 Colores disponibles: ${colors.join(", ")}` : "",
        `⏱ Tiempo de entrega: ${leadTime}`,
        `✏️ Personalizable: ${customizable ? "sí" : "no"}`,
        "¿Querés que te lo prepare?",
      ]
        .filter(Boolean)
        .join("\n");
      return {
        title: product.name,
        description,
        suggested_tags: [],
        photo_checklist: BASE_PHOTO_CHECKLIST,
      };
    }
    case "manual":
    default: {
      const description = [
        product.name,
        baseDescription,
        `Precio: ${price}`,
        `Tiempo de entrega: ${leadTime}`,
      ].join("\n");
      return {
        title: product.name,
        description,
        suggested_tags: [],
        photo_checklist: BASE_PHOTO_CHECKLIST,
      };
    }
  }
}
