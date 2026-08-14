-- Research-candidate fields for the model library: who made it, where the
-- license evidence lives, and an explicit human commercial-use verification
-- status. Every candidate starts "pending" — free-to-download is never
-- treated as verified. This does not change the existing sellable-product
-- gate (checkPublishableStatus), which still reads commercial_use_allowed.
ALTER TABLE "models"
    ADD COLUMN "creator" TEXT,
    ADD COLUMN "license_evidence" TEXT,
    ADD COLUMN "commercial_use_verification_status" TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN "commercial_use_verified_by" UUID,
    ADD COLUMN "commercial_use_verified_at" TIMESTAMPTZ(6);

ALTER TABLE "models"
    ADD CONSTRAINT "models_commercial_use_verification_status_check"
    CHECK (commercial_use_verification_status IN ('pending', 'verified', 'rejected'));
