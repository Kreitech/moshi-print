-- Optional pricing / lightweight revenue tracking on orders.
-- Not a payment system — charged_price is what the customer was billed;
-- production cost tracking is a separate future concern.
ALTER TABLE "orders"
    ADD COLUMN "charged_price_amount" NUMERIC(12, 2),
    ADD COLUMN "charged_price_currency" TEXT DEFAULT 'UYU',
    ADD COLUMN "charged_price_notes" TEXT,
    ADD COLUMN "quoted_price_amount" NUMERIC(12, 2),
    ADD COLUMN "quoted_price_currency" TEXT DEFAULT 'UYU',
    ADD COLUMN "payment_status" TEXT NOT NULL DEFAULT 'not_tracked';

ALTER TABLE "orders"
    ADD CONSTRAINT "orders_payment_status_check"
    CHECK (payment_status IN ('not_tracked', 'pending', 'partial', 'paid'));

ALTER TABLE "orders"
    ADD CONSTRAINT "orders_charged_price_amount_check"
    CHECK (charged_price_amount IS NULL OR charged_price_amount >= 0);

ALTER TABLE "orders"
    ADD CONSTRAINT "orders_quoted_price_amount_check"
    CHECK (quoted_price_amount IS NULL OR quoted_price_amount >= 0);
