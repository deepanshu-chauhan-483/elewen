-- Add unique constraint on oauth_accounts (provider, providerUserId)
-- Required for upsert in googleSession controller
CREATE UNIQUE INDEX "oauth_accounts_provider_providerUserId_key"
  ON "api"."oauth_accounts"("provider", "providerUserId");
