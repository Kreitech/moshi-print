-- Extra source/license fields for the model library (Yessi may source STLs online).
-- source_platform stays free-form TEXT (no CHECK) to avoid invalidating any values
-- already stored; the UI constrains new entries to a known list instead.
ALTER TABLE "models"
    ADD COLUMN "attribution_text" TEXT,
    ADD COLUMN "license_notes" TEXT;
