-- Delivers the UNIQUE (tx_hash, event_type) guarantee to databases created
-- before it was added to schema.sql (#846). Duplicates are removed first,
-- keeping the earliest row. On databases created from the current schema.sql
-- the constraint's own index already has this name, so this is a no-op.
DELETE FROM ledger_events a
USING ledger_events b
WHERE a.tx_hash = b.tx_hash
  AND a.event_type = b.event_type
  AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS ledger_events_tx_hash_event_type_key
  ON ledger_events (tx_hash, event_type);
