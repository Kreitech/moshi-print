export type LicenseGateResult = { allowed: true } | { allowed: false; reason: string };

// Business rule: "ready" and "published" product statuses require the source
// model's commercial-use status to be confirmed true, or an explicit
// admin/owner override backed by a note. "draft" is always allowed, even with
// an unknown license, since nothing is being published yet.
export function checkPublishableStatus(
  status: string,
  commercialUseAllowed: boolean | null,
  licenseNotes: string | null,
  isAdminOrOwner: boolean
): LicenseGateResult {
  if (status !== "ready" && status !== "published") return { allowed: true };

  if (commercialUseAllowed === true) return { allowed: true };

  if (commercialUseAllowed === false) {
    return {
      allowed: false,
      reason: "No se puede publicar: el modelo de origen no permite uso comercial.",
    };
  }

  // commercial_use_allowed is null/unknown — allow only as an explicit
  // admin/owner override, documented with a note.
  if (isAdminOrOwner && licenseNotes && licenseNotes.trim().length > 0) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason:
      "No está confirmada la licencia comercial de este modelo. Un admin o propietario debe confirmarla, o dejar una nota de licencia explicando la excepción, antes de marcar el producto como listo o publicado.",
  };
}
