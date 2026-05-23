ALTER TABLE posts ADD COLUMN tags TEXT DEFAULT '[]';

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  em TEXT NOT NULL,
  bg TEXT DEFAULT 'linear-gradient(135deg,#f3f4f6,#e5e7eb)',
  badge_cls TEXT DEFAULT 'new',
  badge_txt TEXT DEFAULT 'NEW',
  cat TEXT NOT NULL,
  name TEXT NOT NULL,
  seller TEXT,
  price TEXT,
  price_num INTEGER DEFAULT 0,
  interest INTEGER DEFAULT 0,
  status TEXT DEFAULT '판매중',
  tag TEXT DEFAULT '',
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO products (id, em, bg, badge_cls, badge_txt, cat, name, seller, price, price_num, interest, status, tag, view_count) VALUES
(1,  '👟', 'linear-gradient(135deg,#f3f4f6,#e5e7eb)', 'hot',  '🔥 HOT', '스니커즈', 'Air Jordan 1 Retro High OG "Lost & Found"',   '@sneaker.kang', '₩ 680,000',    680000,    84, '판매중',  '빠른거래', 1008),
(2,  '👜', 'linear-gradient(135deg,#f9fafb,#f3f4f6)', 'new',  'NEW',    '명품',    'Gucci Ophidia GG Medium Tote',                 '@luxe.j',       '₩ 1,240,000',  1240000,   31, '판매중',  '인증셀러',  372),
(3,  '⌚', 'linear-gradient(135deg,#f3f4f6,#e5e7eb)', 'rare', 'RARE',   '시계',    'Rolex Submariner Date 41mm',                   '@watch.yk',     '₩ 12,800,000', 12800000,  62, '예약중',  '협업모집',  744),
(4,  '🧥', 'linear-gradient(135deg,#f9fafb,#f3f4f6)', 'new',  'NEW',    '의류',    'Stone Island Shadow Project Shell',             '@techwear.s',   '₩ 980,000',    980000,    28, '판매중',  '',         336),
(5,  '👟', 'linear-gradient(135deg,#f3f4f6,#e5e7eb)', 'hot',  'HOT',    '스니커즈', 'Nike Dunk Low Panda',                          '@kicks.p',      '₩ 189,000',    189000,    47, '판매완료', '',         564),
(6,  '💍', 'linear-gradient(135deg,#f9fafb,#f3f4f6)', 'rare', 'RARE',   '명품',    'Cartier Love Bracelet Yellow Gold',            '@gold.s',       '₩ 2,100,000',  2100000,   39, '판매중',  '인증셀러',  468),
(7,  '👟', 'linear-gradient(135deg,#f3f4f6,#e5e7eb)', 'hot',  '🔥 HOT', '스니커즈', 'Nike SB Dunk Low "Tiffany"',                   '@sneaker.kang', '₩ 320,000',    320000,    55, '판매중',  '빠른거래',  660),
(8,  '👜', 'linear-gradient(135deg,#f9fafb,#f3f4f6)', 'new',  'NEW',    '명품',    'Louis Vuitton Keepall 55',                     '@luxe.j',       '₩ 1,850,000',  1850000,   22, '판매중',  '인증셀러',  264),
(9,  '⌚', 'linear-gradient(135deg,#f3f4f6,#e5e7eb)', 'rare', 'RARE',   '시계',    'Omega Seamaster Planet Ocean 42mm',            '@watch.yk',     '₩ 4,200,000',  4200000,   33, '판매중',  '',         396),
(10, '👟', 'linear-gradient(135deg,#f9fafb,#f3f4f6)', 'new',  'NEW',    '스니커즈', 'New Balance 2002R "Protection Pack"',          '@kicks.p',      '₩ 148,000',    148000,    41, '판매중',  '',         492),
(11, '🧥', 'linear-gradient(135deg,#f3f4f6,#e5e7eb)', 'hot',  'HOT',    '의류',    "Arc'teryx Alpha SV Jacket",                    '@techwear.s',   '₩ 1,200,000',  1200000,   19, '판매중',  '빠른거래',  228),
(12, '👟', 'linear-gradient(135deg,#f9fafb,#f3f4f6)', 'rare', 'RARE',   '스니커즈', 'Off-White x Nike Dunk Low "Lot 01"',           '@sneaker.kang', '₩ 520,000',    520000,    71, '판매중',  '인증셀러',  852),
(13, '👜', 'linear-gradient(135deg,#f3f4f6,#e5e7eb)', 'new',  'NEW',    '명품',    'Chanel Classic Flap Medium',                   '@luxe.j',       '₩ 8,400,000',  8400000,   58, '판매중',  '인증셀러',  696),
(14, '⌚', 'linear-gradient(135deg,#f9fafb,#f3f4f6)', 'hot',  'HOT',    '시계',    'AP Royal Oak 41mm Steel',                     '@watch.yk',     '₩ 28,500,000', 28500000,  45, '예약중',  '',         540),
(15, '🧥', 'linear-gradient(135deg,#f3f4f6,#e5e7eb)', 'new',  'NEW',    '의류',    'Palace Tri-Ferg Windbreaker FW24',             '@techwear.s',   '₩ 560,000',    560000,    24, '판매중',  '',         288),
(16, '👟', 'linear-gradient(135deg,#f9fafb,#f3f4f6)', 'hot',  '🔥 HOT', '스니커즈', 'Adidas Yeezy Boost 350 V2 "Zebra"',            '@kicks.p',      '₩ 380,000',    380000,    36, '판매중',  '빠른거래',  432);