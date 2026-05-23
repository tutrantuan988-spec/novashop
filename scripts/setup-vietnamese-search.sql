-- Setup Vietnamese text search configuration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'vietnamese') THEN
    CREATE TEXT SEARCH CONFIGURATION vietnamese (COPY = simple);
    CREATE TEXT SEARCH DICTIONARY vietnamese_stem (TEMPLATE = snowball, Language = 'english');
    ALTER TEXT SEARCH CONFIGURATION vietnamese ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part WITH vietnamese_stem;
  END IF;
END $$;

SELECT 'Vietnamese text search configured' AS status;
