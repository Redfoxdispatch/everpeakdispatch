-- AlterEnum
-- Self-registered shipper/carrier companies land here awaiting brokerage_admin
-- review — see context/01-business-workflow.md §4.9.
ALTER TYPE "CompanyStatus" ADD VALUE 'pending' BEFORE 'active';
