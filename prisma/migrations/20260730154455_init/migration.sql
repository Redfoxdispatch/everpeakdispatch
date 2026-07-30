-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('invited', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('internal', 'shipper', 'carrier');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('active', 'suspended', 'archived');

-- CreateEnum
CREATE TYPE "AuthorityType" AS ENUM ('common', 'contract', 'broker');

-- CreateEnum
CREATE TYPE "AuthorityStatus" AS ENUM ('active', 'inactive', 'revoked', 'pending');

-- CreateEnum
CREATE TYPE "SafetyRating" AS ENUM ('satisfactory', 'conditional', 'unsatisfactory', 'not_rated');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('active', 'maintenance', 'inactive');

-- CreateEnum
CREATE TYPE "LoadMode" AS ENUM ('ftl', 'ltl');

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('draft', 'quote_requested', 'quoted', 'booked', 'carrier_sourcing', 'dispatched', 'at_pickup', 'picked_up', 'in_transit', 'at_delivery', 'delivered', 'completed', 'invoiced', 'paid', 'closed', 'cancelled', 'on_hold');

-- CreateEnum
CREATE TYPE "StopType" AS ENUM ('pickup', 'delivery');

-- CreateEnum
CREATE TYPE "StopStatus" AS ENUM ('pending', 'arrived', 'completed', 'exception');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('pending', 'accepted', 'rejected', 'countered', 'expired');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('offered', 'accepted', 'declined', 'fell_off', 'cancelled');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('bol', 'pod', 'rate_confirmation', 'insurance_certificate', 'w9', 'invoice', 'other');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('internal', 'shipper', 'carrier', 'public');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('pending_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('shipper_invoice', 'carrier_settlement');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'disputed', 'void');

-- CreateEnum
CREATE TYPE "AccessorialType" AS ENUM ('base_rate', 'detention', 'tonu', 'layover', 'lumper', 'redelivery', 'storage', 'other');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ach', 'card', 'check', 'wire', 'other');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('status_change', 'location_update', 'exception', 'note');

-- CreateEnum
CREATE TYPE "TrackingSource" AS ENUM ('manual', 'driver_app', 'eld', 'api');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('shipper_broker', 'carrier_broker', 'internal');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email', 'sms');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "status" "ProfileStatus" NOT NULL DEFAULT 'invited',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_system_role" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" TEXT,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "type" "CompanyType" NOT NULL,
    "legal_name" TEXT NOT NULL,
    "dba_name" TEXT,
    "billing_address" JSONB,
    "phone" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipper_profiles" (
    "company_id" UUID NOT NULL,
    "industry" TEXT,
    "tax_id" TEXT,
    "credit_limit" DECIMAL(12,2),
    "payment_terms_days" INTEGER NOT NULL DEFAULT 30,
    "credit_hold" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "shipper_profiles_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "carrier_profiles" (
    "company_id" UUID NOT NULL,
    "mc_number" TEXT NOT NULL,
    "dot_number" TEXT NOT NULL,
    "scac_code" TEXT,
    "authority_type" "AuthorityType" NOT NULL,
    "authority_status" "AuthorityStatus" NOT NULL DEFAULT 'pending',
    "insurance_provider" TEXT,
    "insurance_policy_number" TEXT,
    "insurance_expiry_date" DATE NOT NULL,
    "safety_rating" "SafetyRating" NOT NULL DEFAULT 'not_rated',
    "equipment_types" TEXT[],
    "factoring_company_name" TEXT,
    "factoring_company_remit_to" JSONB,

    CONSTRAINT "carrier_profiles_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "carrier_id" UUID NOT NULL,
    "user_id" UUID,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "license_number" TEXT,
    "license_expiry" DATE,
    "status" "DriverStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "carrier_id" UUID NOT NULL,
    "equipment_type" TEXT NOT NULL,
    "vin" TEXT,
    "plate_number" TEXT,
    "capacity_weight_lbs" INTEGER,
    "status" "VehicleStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_types" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "equipment_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "loads" (
    "id" UUID NOT NULL,
    "load_number" TEXT NOT NULL,
    "shipper_company_id" UUID NOT NULL,
    "status" "LoadStatus" NOT NULL DEFAULT 'draft',
    "mode" "LoadMode" NOT NULL,
    "equipment_type" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "weight_lbs" INTEGER NOT NULL,
    "special_instructions" TEXT,
    "accepted_quote_id" UUID,
    "created_by" UUID NOT NULL,
    "cancelled_reason" TEXT,
    "cancelled_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_stops" (
    "id" UUID NOT NULL,
    "load_id" UUID NOT NULL,
    "stop_type" "StopType" NOT NULL,
    "sequence" SMALLINT NOT NULL,
    "address" JSONB NOT NULL,
    "appointment_earliest" TIMESTAMPTZ(6) NOT NULL,
    "appointment_latest" TIMESTAMPTZ(6) NOT NULL,
    "actual_arrival" TIMESTAMPTZ(6),
    "actual_departure" TIMESTAMPTZ(6),
    "status" "StopStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "load_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL,
    "load_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previous_quote_id" UUID,
    "sell_rate" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "valid_until" TIMESTAMPTZ(6) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "load_id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "confirmed_rate" DECIMAL(12,2) NOT NULL,
    "booked_by" UUID NOT NULL,
    "booked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_assignments" (
    "id" UUID NOT NULL,
    "load_id" UUID NOT NULL,
    "carrier_company_id" UUID NOT NULL,
    "carrier_rate" DECIMAL(12,2) NOT NULL,
    "driver_id" UUID,
    "vehicle_id" UUID,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'offered',
    "offered_by" UUID NOT NULL,
    "offered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ(6),
    "fell_off_reason" TEXT,

    CONSTRAINT "carrier_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "load_id" UUID,
    "owner_company_id" UUID,
    "document_type" "DocumentType" NOT NULL,
    "file_path" TEXT NOT NULL,
    "visibility" "DocumentVisibility" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'pending_review',
    "rejected_reason" TEXT,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "load_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "company_id" UUID NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "due_date" DATE NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "dispute_reason" TEXT,
    "issued_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "accessorial_type" "AccessorialType",
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "transaction_ref" TEXT,
    "paid_at" TIMESTAMPTZ(6),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" UUID NOT NULL,
    "load_id" UUID NOT NULL,
    "event_type" "TrackingEventType" NOT NULL,
    "status" TEXT,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "description" TEXT,
    "source" "TrackingSource" NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "load_id" UUID,
    "type" "ConversationType" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'in_app',
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profiles_company_id_idx" ON "profiles"("company_id");

-- CreateIndex
CREATE INDEX "profiles_role_id_idx" ON "profiles"("role_id");

-- CreateIndex
CREATE INDEX "profiles_status_idx" ON "profiles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_scope_key" ON "permissions"("resource", "action", "scope");

-- CreateIndex
CREATE INDEX "companies_type_idx" ON "companies"("type");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE UNIQUE INDEX "carrier_profiles_mc_number_key" ON "carrier_profiles"("mc_number");

-- CreateIndex
CREATE UNIQUE INDEX "carrier_profiles_dot_number_key" ON "carrier_profiles"("dot_number");

-- CreateIndex
CREATE INDEX "carrier_profiles_authority_status_insurance_expiry_date_idx" ON "carrier_profiles"("authority_status", "insurance_expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_user_id_key" ON "drivers"("user_id");

-- CreateIndex
CREATE INDEX "drivers_carrier_id_idx" ON "drivers"("carrier_id");

-- CreateIndex
CREATE INDEX "vehicles_carrier_id_idx" ON "vehicles"("carrier_id");

-- CreateIndex
CREATE INDEX "vehicles_equipment_type_idx" ON "vehicles"("equipment_type");

-- CreateIndex
CREATE UNIQUE INDEX "loads_load_number_key" ON "loads"("load_number");

-- CreateIndex
CREATE UNIQUE INDEX "loads_accepted_quote_id_key" ON "loads"("accepted_quote_id");

-- CreateIndex
CREATE INDEX "loads_status_idx" ON "loads"("status");

-- CreateIndex
CREATE INDEX "loads_shipper_company_id_idx" ON "loads"("shipper_company_id");

-- CreateIndex
CREATE INDEX "loads_created_at_idx" ON "loads"("created_at");

-- CreateIndex
CREATE INDEX "load_stops_load_id_sequence_idx" ON "load_stops"("load_id", "sequence");

-- CreateIndex
CREATE INDEX "quotes_load_id_status_idx" ON "quotes"("load_id", "status");

-- CreateIndex
CREATE INDEX "quotes_valid_until_idx" ON "quotes"("valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_load_id_key" ON "bookings"("load_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_quote_id_key" ON "bookings"("quote_id");

-- CreateIndex
CREATE INDEX "carrier_assignments_carrier_company_id_status_idx" ON "carrier_assignments"("carrier_company_id", "status");

-- CreateIndex
CREATE INDEX "carrier_assignments_load_id_status_idx" ON "carrier_assignments"("load_id", "status");

-- CreateIndex
CREATE INDEX "documents_load_id_idx" ON "documents"("load_id");

-- CreateIndex
CREATE INDEX "documents_document_type_status_idx" ON "documents"("document_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_company_id_status_idx" ON "invoices"("company_id", "status");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");

-- CreateIndex
CREATE INDEX "invoices_type_idx" ON "invoices"("type");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "tracking_events_load_id_created_at_idx" ON "tracking_events"("load_id", "created_at");

-- CreateIndex
CREATE INDEX "conversations_load_id_idx" ON "conversations"("load_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipper_profiles" ADD CONSTRAINT "shipper_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_profiles" ADD CONSTRAINT "carrier_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_equipment_type_fkey" FOREIGN KEY ("equipment_type") REFERENCES "equipment_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loads" ADD CONSTRAINT "loads_shipper_company_id_fkey" FOREIGN KEY ("shipper_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loads" ADD CONSTRAINT "loads_equipment_type_fkey" FOREIGN KEY ("equipment_type") REFERENCES "equipment_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loads" ADD CONSTRAINT "loads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loads" ADD CONSTRAINT "loads_accepted_quote_id_fkey" FOREIGN KEY ("accepted_quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_stops" ADD CONSTRAINT "load_stops_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_previous_quote_id_fkey" FOREIGN KEY ("previous_quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booked_by_fkey" FOREIGN KEY ("booked_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_assignments" ADD CONSTRAINT "carrier_assignments_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_assignments" ADD CONSTRAINT "carrier_assignments_carrier_company_id_fkey" FOREIGN KEY ("carrier_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_assignments" ADD CONSTRAINT "carrier_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_assignments" ADD CONSTRAINT "carrier_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_assignments" ADD CONSTRAINT "carrier_assignments_offered_by_fkey" FOREIGN KEY ("offered_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_company_id_fkey" FOREIGN KEY ("owner_company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- Hand-written additions (not expressible in the Prisma schema DSL)
-- ─────────────────────────────────────────────────────────────

-- Link profiles to Supabase-managed auth.users. Deleting an auth user
-- cascades to remove their profile.
ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE;

-- Only one carrier assignment can be "accepted" per load at a time.
CREATE UNIQUE INDEX "carrier_assignments_one_accepted_per_load"
  ON "carrier_assignments" ("load_id")
  WHERE "status" = 'accepted';

-- Sanity check constraints
ALTER TABLE "loads"
  ADD CONSTRAINT "loads_weight_positive" CHECK ("weight_lbs" > 0);

ALTER TABLE "load_stops"
  ADD CONSTRAINT "load_stops_appointment_window" CHECK ("appointment_earliest" <= "appointment_latest");

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_amount_paid_within_total" CHECK ("amount_paid" <= "total_amount");

-- Row Level Security — enabled with no policies yet on every table.
-- Prisma's server actions connect directly to Postgres and bypass RLS entirely
-- (see context/04-application-architecture.md §3), so this block exists purely
-- to close Supabase's auto-generated PostgREST API: without RLS enabled, every
-- table below would be reachable via the anon/authenticated Supabase REST API
-- the instant this migration runs. Deny-by-default until real policies are
-- written (Phase 7 Realtime needs a few; Phase 9 does a full pass).
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shipper_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "carrier_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "drivers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipment_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "load_stops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "carrier_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_line_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tracking_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
