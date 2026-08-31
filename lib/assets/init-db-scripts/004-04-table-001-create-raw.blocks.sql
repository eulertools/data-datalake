-- 04-table-001-raw.create-blocks

-- Table: raw.blocks

-- DROP TABLE raw.blocks;

CREATE TABLE raw.blocks
(
    "number" bigint NOT NULL,
    hash varchar(66) COLLATE pg_catalog."default" NOT NULL,
    parent_hash varchar(66) COLLATE pg_catalog."default",
    nonce varchar(42) COLLATE pg_catalog."default",
    sha3_uncles varchar(66) COLLATE pg_catalog."default",
    logs_bloom text COLLATE pg_catalog."default",
    transactions_root varchar(66) COLLATE pg_catalog."default",
    state_root varchar(66) COLLATE pg_catalog."default",
    receipts_root varchar(66) COLLATE pg_catalog."default",
    miner varchar(42) COLLATE pg_catalog."default",
    difficulty numeric(38,0),
    total_difficulty numeric(38,0),
    size bigint,
    extra_data text COLLATE pg_catalog."default",
    gas_limit bigint,
    gas_used bigint,
    "timestamp" timestamp without time zone,
    transaction_count bigint,
    logs_count bigint,
    CONSTRAINT blocks_pk PRIMARY KEY ("number","timestamp")
) PARTITION BY RANGE ("timestamp");

ALTER TABLE raw.blocks OWNER to postgres;

GRANT SELECT ON TABLE raw.blocks TO ${params.chain_id}_group_ro;

GRANT ALL ON TABLE raw.blocks TO postgres;

CREATE INDEX blocks_number_timestamp_idx ON raw.blocks USING BTREE ("number", "timestamp" DESC);

CREATE INDEX blocks_hash_timestamp_idx ON raw.blocks USING BTREE ("hash", "timestamp" desc);

CREATE INDEX blocks_timestamp_brin_idx ON raw.blocks USING BRIN ("timestamp") WITH (pages_per_range = 32);

SELECT partman.create_parent(
    p_parent_table => 'raw.blocks',
    p_control => 'timestamp'::varchar,
    p_type => 'native'::varchar,
    p_interval => 'daily'::varchar,
    p_start_partition := '${params.start_partition}'::varchar);