-- ZUERST die Migrationen 202610150002_reviews.sql und
-- 202610150003_review_scheduler.sql ausführen und die Website deployen.
-- In Vercel muss CRON_SECRET gesetzt sein (mindestens 32 zufällige Zeichen).
-- Unten denselben Wert einsetzen. Nicht in Git oder den Chat kopieren.
-- Wiederholbar; aktualisiert ausschließlich diesen einen Zeitgeber/Vault-Eintrag.
select public.crm_configure_review_scheduler('HIER_DEIN_CRON_SECRET_AUS_VERCEL');
