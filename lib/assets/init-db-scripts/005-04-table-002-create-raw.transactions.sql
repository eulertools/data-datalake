
-- 04-table-002-create-raw.transactions

-- Table: raw.transactions

-- DROP TABLE raw.transactions;

CREATE TABLE raw.transactions
(
    hash varchar(66) COLLATE pg_catalog."default" NOT NULL,
    nonce bigint,
    transaction_index bigint NOT NULL,
    from_address varchar(42) COLLATE pg_catalog."default",
    to_address varchar(42) COLLATE pg_catalog."default",
    value numeric(38,0),
    gas bigint,
    gas_price bigint,
    input text COLLATE pg_catalog."default",
    receipt_cumulative_gas_used bigint,
    receipt_gas_used bigint,
    receipt_contract_address varchar(42) COLLATE pg_catalog."default",
    receipt_root varchar(66) COLLATE pg_catalog."default",
    receipt_status bigint,
    block_timestamp timestamp without time zone,
    block_number bigint,
    block_hash varchar(66) COLLATE pg_catalog."default",
    max_fee_per_gas bigint,
    max_priority_fee_per_gas bigint,
    transaction_type bigint,
    CONSTRAINT transactions_pk PRIMARY KEY (hash, block_timestamp)
) PARTITION BY RANGE (block_timestamp);

ALTER TABLE raw.transactions OWNER to postgres;

GRANT SELECT ON TABLE raw.transactions TO ${params.chain_id}_group_ro;

GRANT ALL ON TABLE raw.transactions TO postgres;

CREATE INDEX transactions_hash_block_timestamp_idx ON raw.transactions USING BTREE ("hash", "block_timestamp" DESC);

CREATE INDEX transactions_from_address_idx ON raw.transactions USING BTREE ("from_address", "block_timestamp" DESC);

CREATE INDEX transactions_to_address_idx ON raw.transactions USING BTREE ("to_address", "block_timestamp" DESC);

CREATE INDEX transactions_from_address_to_address_block_timestamp_idx ON raw.transactions USING BTREE ("from_address", "to_address", "block_timestamp" DESC);

CREATE INDEX transactions_block_number_idx ON raw.transactions USING BTREE ("block_number", "block_timestamp" DESC);

CREATE INDEX transactions_block_timestamp_brin_idx ON raw.transactions USING BRIN ("block_timestamp") WITH (pages_per_range = 32);

SELECT partman.create_parent(
    p_parent_table => 'raw.transactions',
    p_control => 'block_timestamp'::varchar,
    p_type => 'native'::varchar,
    p_interval => 'daily'::varchar,
    p_start_partition := '${params.start_partition}'::varchar);