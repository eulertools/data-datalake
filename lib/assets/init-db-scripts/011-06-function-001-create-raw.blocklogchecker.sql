
-- 06-function-001-create-raw.blocklogchecker

--DROP FUNCTION raw.blocklogchecker(bigint)

CREATE OR REPLACE FUNCTION raw.blocklogchecker(_block_number bigint) 
RETURNS TABLE(block_number bigint, all_transactions boolean,all_logs boolean,all_tokens_transfer boolean,all_trades boolean, all_ok boolean) 
AS $$
begin
	RETURN query
	select v.*, (v.all_transactions and v.all_logs and v.all_tokens_transfer and v.all_trades) as all_ok
	from (
		select b."number" as block_number, 
		coalesce(transaction_count = t.count, false) as all_transactions, 
		coalesce(logs_count = l.count, false) as all_logs,
		coalesce(lt.count = tt.count, false) as all_tokens_transfer,
		coalesce(ltd.count = td.count, false) as all_trades
		from raw.blocks b 
		inner join lateral(
			select count(*) as count 
			from raw.transactions t 
			where t.block_timestamp = b."timestamp") as t on true
		inner join lateral(
			select count(*) as count 
			from raw.logs l 
			where l.block_timestamp = b."timestamp") as l on true
		inner join lateral(
			select count(*) as count 
			from raw.token_transfers tt 
			where tt.block_timestamp = b."timestamp") as tt on true
		inner join lateral(
			select count(*) as count 
			from raw.logs lt 
			where lt.block_timestamp = b."timestamp" and  lt.topic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') as lt on true
		inner join lateral(
			select count(*) as count 
			from raw.trades td 
			where td.block_timestamp = b."timestamp") as td on true
		inner join lateral(
			select count(*) as count 
			from raw.logs ltd
			where ltd.block_timestamp = b."timestamp" and  ltd.topic0 = '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822') as ltd on true
		where b.number = _block_number) as v;
END;
$$ LANGUAGE plpgsql;
