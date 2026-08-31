
-- 04-table-006-create-raw.tokens_transfer

-- Table: raw.farm_transfers

-- DROP TABLE raw.farm_transfers;

CREATE TABLE raw.farm_transfers
(
    contract_address varchar(42) COLLATE pg_catalog."default",
    token_lp_address varchar(42) COLLATE pg_catalog."default",
    from_address varchar(42) COLLATE pg_catalog."default",
    token0_address varchar(42) COLLATE pg_catalog."default",
    token1_address varchar(42) COLLATE pg_catalog."default",
    value numeric(78,0),
    kind varchar(42) COLLATE pg_catalog."default",
    input boolean,
    transaction_hash varchar(66) COLLATE pg_catalog."default" NOT NULL,
    log_index bigint NOT NULL,
    block_timestamp timestamp without time zone NOT NULL,
    block_number bigint,
    block_hash varchar(66) COLLATE pg_catalog."default",
    CONSTRAINT pk_farm_transfers PRIMARY KEY (transaction_hash, log_index, block_timestamp)
) PARTITION BY RANGE (block_timestamp);

ALTER TABLE raw.farm_transfers OWNER to postgres;

GRANT SELECT ON TABLE raw.farm_transfers TO ${params.chain_id}_group_ro;

GRANT ALL ON TABLE raw.farm_transfers TO postgres;

CREATE INDEX farm_transfers_transaction_hash_log_index_block_timestamp_idx ON raw.farm_transfers USING BTREE ("transaction_hash", "log_index", "block_timestamp" DESC);

CREATE INDEX farm_transfers_transaction_hash_block_timestamp_idx ON raw.farm_transfers USING BTREE ("transaction_hash", "block_timestamp" DESC);

CREATE INDEX farm_transfers_from_address_block_timestamp_idx ON raw.farm_transfers USING BTREE ("from_address", "block_timestamp" DESC);

CREATE INDEX farm_transfers_contract_address_block_timestamp_idx ON raw.farm_transfers USING BTREE ("contract_address", "block_timestamp" DESC);

CREATE INDEX farm_transfers_contract_token_from_block_timestamp_idx ON raw.farm_transfers 
    USING BTREE ("contract_address", "token_lp_address", "from_address", "block_timestamp" DESC);

CREATE INDEX farm_transfers_token_address_block_timestamp_idx ON raw.farm_transfers USING BTREE ("token_lp_address", "block_timestamp" DESC);

CREATE INDEX farm_transfers_block_number_block_timestamp_idx ON raw.farm_transfers USING BTREE ("block_number", "block_timestamp" DESC);

CREATE INDEX farm_transfers_block_timestamp_brin_idx ON raw.farm_transfers USING BRIN ("block_timestamp") WITH (pages_per_range = 32);

SELECT partman.create_parent(
    p_parent_table => 'raw.farm_transfers',
    p_control => 'block_timestamp'::varchar,
    p_type => 'native'::varchar,
    p_interval => 'daily'::varchar,
    p_start_partition := '${params.start_partition}'::varchar);