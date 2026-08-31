
-- 02-role-001-create-group_ro

-- Role: group_ro

CREATE ROLE ${params.chain_id}_group_ro WITH
    NOLOGIN
    NOSUPERUSER
    INHERIT
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION;

GRANT ALL ON DATABASE mainnet TO postgres;

GRANT TEMPORARY, CONNECT ON DATABASE mainnet TO PUBLIC;

GRANT CONNECT ON DATABASE mainnet TO ${params.chain_id}_group_ro;