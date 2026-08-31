
-- 04-table-007-create-raw.wallet_transfers

-- Table: raw.wallet_transfers

--DROP TABLE raw.wallet_transfers; 

CREATE TABLE raw.wallet_transfers
(
	block_number bigint,
	block_timestamp timestamp without time zone NOT NULL,
	transaction_hash varchar(66) COLLATE pg_catalog."default" NOT NULL,
	transfer_hash varchar(66) COLLATE pg_catalog."default" NOT NULL,
    token_address varchar(42) COLLATE pg_catalog."default",
    wallet_address varchar(42) COLLATE pg_catalog."default",
    from_address varchar(42) COLLATE pg_catalog."default",
    to_address varchar(42) COLLATE pg_catalog."default",
    value numeric(78,0),
    price_usd numeric(78,18),
    transaction_kind varchar(42) COLLATE pg_catalog."default",
    CONSTRAINT pk_wallet_transfers PRIMARY KEY (transfer_hash, block_timestamp)
) PARTITION BY RANGE (block_timestamp);

ALTER TABLE raw.wallet_transfers OWNER to postgres;

GRANT SELECT ON TABLE raw.wallet_transfers TO ${params.chain_id}_group_ro;

GRANT ALL ON TABLE raw.wallet_transfers TO postgres;

CREATE INDEX wallet_transfers_transaction_hash_block_timestamp_idx ON raw.wallet_transfers USING BTREE ("transaction_hash", "block_timestamp" DESC);

CREATE INDEX wallet_transfers_from_address_block_timestamp_idx ON raw.wallet_transfers USING BTREE ("wallet_address", "block_timestamp" DESC);

CREATE INDEX wallet_transfers_token_address_block_timestamp_idx ON raw.wallet_transfers USING BTREE ("token_address", "block_timestamp" DESC);

CREATE INDEX wallet_transfers_block_number_block_timestamp_idx ON raw.wallet_transfers USING BTREE ("block_number", "block_timestamp" DESC);

CREATE INDEX wallet_transfers_block_timestamp_brin_idx ON raw.wallet_transfers USING BRIN ("block_timestamp") WITH (pages_per_range = 32);

SELECT partman.create_parent(
    p_parent_table => 'raw.wallet_transfers',
    p_control => 'block_timestamp'::varchar,
    p_type => 'native'::varchar,
    p_interval => 'daily'::varchar,
    p_start_partition := '${params.start_partition}'::varchar);