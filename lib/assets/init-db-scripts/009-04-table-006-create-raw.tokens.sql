
-- 04-table-006-create-raw.tokens

-- Table: raw.tokens

-- DROP TABLE raw.tokens;

CREATE TABLE raw.tokens (
    address varchar(42) NOT NULL COLLATE pg_catalog."default",
    symbol varchar(25) NOT NULL COLLATE pg_catalog."default",
    name text,
    decimals integer,
    total_supply text NOT NULL,
    kind varchar(25), -- kind: WETH, STABLE, NORMAL, LP, SCAM
    token_base varchar(42) COLLATE pg_catalog."default",
    token_quote varchar(42) COLLATE pg_catalog."default",
    fees_transfer numeric(19,18),
    buy_transfer numeric(19,18),
    sell_transfer numeric(19,18),
    CONSTRAINT pk_tokens PRIMARY KEY (address)
);

ALTER TABLE raw.tokens OWNER to postgres;

GRANT SELECT ON TABLE raw.tokens TO ${params.chain_id}_group_ro;

GRANT ALL ON TABLE raw.tokens TO postgres;

CREATE INDEX tokens_symbol_idx ON raw.tokens USING BTREE ("symbol");

CREATE INDEX tokens_kind_idx ON raw.tokens USING BTREE ("kind");

CREATE INDEX tokens_token_base_idx ON raw.tokens USING BTREE ("token_base");

CREATE INDEX tokens_token_quote_idx ON raw.tokens USING BTREE ("token_quote");
