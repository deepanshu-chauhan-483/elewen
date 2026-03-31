-- AlterTable: user_sessions."userId" UUID → VARCHAR(50)
-- Reason: Strapi up_users.id is an integer PK, not UUID. JWT payload contains integer id.
-- Note: Prisma stores camelCase fields as camelCase columns (no @map directive = no snake_case)
ALTER TABLE "api"."user_sessions"
  ALTER COLUMN "userId" TYPE VARCHAR(50) USING "userId"::text;

ALTER TABLE "api"."user_sessions"
  ADD CONSTRAINT "user_sessions_refreshToken_key" UNIQUE ("refreshToken");

-- AlterTable: oauth_accounts."userId" UUID → VARCHAR(50)
ALTER TABLE "api"."oauth_accounts"
  ALTER COLUMN "userId" TYPE VARCHAR(50) USING "userId"::text;
