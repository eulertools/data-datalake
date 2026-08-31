-- 04-table-005-create-raw.trades

-- Table: raw.trades

-- DROP TABLE raw.trades;

CREATE TABLE raw.trades
(
    address varchar(100) COLLATE pg_catalog."default",
    base_token varchar(100) COLLATE pg_catalog."default",
    quote_token varchar(100) COLLATE pg_catalog."default",
    transaction_hash varchar(100) NOT NULL COLLATE pg_catalog."default",
    log_index bigint NOT NULL,
    base_amount numeric(78,18),
    quote_amount numeric(78,18),
    base_reserves numeric(78,18),
    quote_reserves numeric(78,18),
    base_price_usd numeric(78,18),
    quote_price_usd numeric(78,18),
    volume numeric(78,18),
    block_number bigint NOT NULL,
    block_timestamp timestamp without time zone NOT NULL,
    CONSTRAINT pk_trades PRIMARY KEY (transaction_hash, log_index, block_timestamp)
) PARTITION BY RANGE (block_timestamp);

ALTER TABLE raw.trades OWNER to postgres;

GRANT SELECT ON TABLE raw.trades TO ${params.chain_id}_group_ro;

GRANT ALL ON TABLE raw.trades TO postgres;

CREATE INDEX trades_transaction_hash_log_index_block_timestamp_idx ON raw.trades USING BTREE ("transaction_hash", "log_index", "block_timestamp" DESC);

CREATE INDEX trades_address_block_timestamp_idx ON raw.trades USING BTREE ("address", "block_timestamp" DESC);

CREATE INDEX trades_transaction_hash_block_timestamp_idx ON raw.trades USING BTREE ("transaction_hash", "block_timestamp" DESC);

CREATE INDEX trades_base_token_block_timestamp_idx ON raw.trades USING BTREE ("base_token", "block_timestamp" DESC);

CREATE INDEX trades_quote_token_block_timestamp_idx ON raw.trades USING BTREE ("quote_token", "block_timestamp" DESC);

CREATE INDEX trades_base_token_quote_token_block_timestamp_idx ON raw.trades USING BTREE ("base_token", "quote_token", "block_timestamp" DESC);

CREATE INDEX trades_block_number_block_timestamp_idx ON raw.trades USING BTREE ("block_number", "block_timestamp" DESC);

CREATE INDEX trades_block_timestamp_brin_idx ON raw.trades USING BRIN ("block_timestamp") WITH (pages_per_range = 32);

SELECT partman.create_parent(
    p_parent_table => 'raw.trades',
    p_control => 'block_timestamp'::varchar,
    p_type => 'native'::varchar,
    p_interval => 'daily'::varchar,
    p_start_partition := '${params.start_partition}'::varchar);