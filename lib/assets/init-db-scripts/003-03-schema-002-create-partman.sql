
-- 03-schema-001-create-partman

-- Schema: partman

CREATE SCHEMA partman AUTHORIZATION postgres;

CREATE EXTENSION pg_partman WITH SCHEMA partman;

GRANT USAGE ON SCHEMA partman TO ${params.chain_id}_group_ro;

GRANT ALL ON SCHEMA partman TO postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA partman
GRANT SELECT ON TABLES TO ${params.chain_id}_group_ro;

ALTER DEFAULT PRIVILEGES IN SCHEMA partman
GRANT SELECT ON SEQUENCES TO ${params.chain_id}_group_ro;
