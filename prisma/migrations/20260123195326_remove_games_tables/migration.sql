-- DropIndex
DROP INDEX IF EXISTS "games_status_idx";
DROP INDEX IF EXISTS "games_created_at_idx";
DROP INDEX IF EXISTS "games_external_id_key";

-- DropIndex
DROP INDEX IF EXISTS "top_games_last_updated_idx";
DROP INDEX IF EXISTS "top_games_external_id_key";

-- DropIndex (for old GameListItem table)
DROP INDEX IF EXISTS "GameListItem_status_idx";
DROP INDEX IF EXISTS "GameListItem_platform_idx";
DROP INDEX IF EXISTS "GameListItem_addedAt_idx";

-- DropTable
DROP TABLE IF EXISTS "games";

-- DropTable
DROP TABLE IF EXISTS "top_games";

-- DropTable (old table from initial migration)
DROP TABLE IF EXISTS "GameListItem";
