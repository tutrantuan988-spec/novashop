CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS VARCHAR(50)
LANGUAGE plpgsql
AS $$
DECLARE
  v_code VARCHAR(50);
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := 'TD' || upper(substr(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;
