
-- 04-table-003-create-raw.logs

-- Table: raw.logs

-- DROP TABLE raw.logs;

CREATE TABLE raw.logs
(
    log_index bigint NOT NULL,
    transaction_hash varchar(66) COLLATE pg_catalog."default" NOT NULL,
    transaction_index bigint,
    address varchar(42) COLLATE pg_catalog."default",
    data text COLLATE pg_catalog."default",
    topic0 varchar(66) COLLATE pg_catalog."default",
    topic1 varchar(66) COLLATE pg_catalog."default",
    topic2 varchar(66) COLLATE pg_catalog."default",
    topic3 varchar(66) COLLATE pg_catalog."default",
    block_timestamp timestamp without time zone,
    block_number bigint,
    block_hash varchar(66) COLLATE pg_catalog."default",
    CONSTRAINT logs_pk PRIMARY KEY (transaction_hash, log_index, block_timestamp)
) PARTITION BY RANGE (block_timestamp);

ALTER TABLE raw.logs OWNER to postgres;

GRANT SELECT ON TABLE raw.logs TO ${params.chain_id}_group_ro;

GRANT ALL ON TABLE raw.logs TO postgres;

CREATE INDEX logs_transaction_hash_log_index_block_timestamp_idx ON raw.logs USING BTREE ("transaction_hash", "log_index", "block_timestamp" DESC);

CREATE INDEX logs_transaction_hash_block_timestamp_idx ON raw.logs USING BTREE ("transaction_hash", "block_timestamp" DESC);

CREATE INDEX logs_block_number_block_timestamp_idx ON raw.logs USING BTREE ("block_number", "block_timestamp" DESC);

CREATE INDEX logs_topic0_block_timestamp_idx ON raw.logs USING BTREE ("topic0", "block_timestamp" DESC);

CREATE INDEX logs_topic1_block_timestamp_idx ON raw.logs USING BTREE ("topic1", "block_timestamp" DESC);

CREATE INDEX logs_topic2_block_timestamp_idx ON raw.logs USING BTREE ("topic2", "block_timestamp" DESC);

CREATE INDEX logs_block_timestamp_brin_idx ON raw.logs USING BRIN ("block_timestamp") WITH (pages_per_range = 32);

SELECT partman.create_parent(
    p_parent_table => 'raw.logs',
    p_control => 'block_timestamp'::varchar,
    p_type => 'native'::varchar,
    p_interval => 'daily'::varchar,
    p_start_partition := '${params.start_partition}'::varchar);
