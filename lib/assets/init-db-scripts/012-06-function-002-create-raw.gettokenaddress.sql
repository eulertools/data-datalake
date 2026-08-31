
-- 06-function-002-create-raw.gettokenaddress

--DROP FUNCTION raw.gettokenaddress(varchar(42))

CREATE OR REPLACE FUNCTION raw.gettokenaddress(_address varchar(42))
RETURNS TABLE(token_address varchar(42)) 
AS $$
begin
    RETURN query
    SELECT token_address 
    FROM raw.token_transfers 
    WHERE to_address = lower(_address)
    group by token_address;
END;
$$  LANGUAGE plpgsql;