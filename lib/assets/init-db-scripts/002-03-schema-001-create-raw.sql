
-- 03-schema-001-create-raw

-- Schema: raw

CREATE SCHEMA raw AUTHORIZATION postgres;

GRANT USAGE ON SCHEMA raw TO ${params.chain_id}_group_ro;

GRANT ALL ON SCHEMA raw TO postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA raw
GRANT SELECT ON TABLES TO ${params.chain_id}_group_ro;

ALTER DEFAULT PRIVILEGES IN SCHEMA raw
GRANT SELECT ON SEQUENCES TO ${params.chain_id}_group_ro;
