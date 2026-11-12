-- रसगुल्ला रन लीडरबोर्ड (Cloudflare D1)
CREATE TABLE IF NOT EXISTS best (
  pid TEXT NOT NULL,          -- खिलाड़ी का बेतरतीब id (फ़ोन में बना)
  period TEXT NOT NULL,       -- '2026-W46' (हफ़्ता, IST) या 'all'
  name TEXT NOT NULL,
  city TEXT NOT NULL,         -- चुना हुआ शहर (darbhanga, madhubani, ...)
  country TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL,
  dist INTEGER NOT NULL DEFAULT 0,
  ts INTEGER NOT NULL,
  PRIMARY KEY (pid, period)
);
CREATE INDEX IF NOT EXISTS best_period_score ON best (period, score DESC);
CREATE INDEX IF NOT EXISTS best_city ON best (period, city, score DESC);
CREATE INDEX IF NOT EXISTS best_country ON best (period, country, score DESC);

-- कुल खिलाड़ी गिनती (हर जगह से: अपनी वेबसाइट, CrazyGames, आगे Play Store)
-- कोई नाम/फ़ोन/IP/आईडी नहीं — सिर्फ़ गिनती (दिन + कहाँ से + देश)
CREATE TABLE IF NOT EXISTS daily (
  day TEXT NOT NULL,          -- '2026-11-12' (IST)
  src TEXT NOT NULL,          -- web / crazygames / playstore
  country TEXT NOT NULL DEFAULT '',
  users INTEGER NOT NULL DEFAULT 0,   -- उस दिन खोलने वाले (हर फ़ोन/ब्राउज़र एक बार)
  newp INTEGER NOT NULL DEFAULT 0,    -- पहली बार खेलने वाले
  games INTEGER NOT NULL DEFAULT 0,   -- कुल दौड़ (गेम)
  PRIMARY KEY (day, src, country)
);
