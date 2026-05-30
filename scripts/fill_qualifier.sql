-- ============================================================
-- SBLT CUP Mùa 1 - Vòng Loại: Fill game results
-- ============================================================

BEGIN;

-- ── Step 1: Create new players (7 players) ──
-- Player: id, ign, userId, isGuest, createdAt
-- User: id, name, email, role, createdAt, updatedAt
-- Registration: id, tournamentId, playerId, status, registeredAt, checkedIn, checkInTime, updatedAt

-- Em Đạt Ixtal #2803 → Lobby 3
INSERT INTO "User" (id, name, email, role, "createdAt", "updatedAt")
VALUES ('new_user_edat', 'Em Đạt Ixtal #2803', 'edat@guest.sbltcup', 'PLAYER', NOW(), NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Player" (id, ign, "userId", "isGuest", "createdAt")
VALUES ('new_player_edat', 'Em Đạt Ixtal #2803', 'new_user_edat', true, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Registration" (id, "tournamentId", "playerId", status, "registeredAt", "checkedIn", "checkInTime", "updatedAt")
VALUES ('new_reg_edat', 'cmou1dbcz0002o5e3udki0i2k', 'new_player_edat', 'APPROVED', NOW(), true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- An So Bad#2007 → Lobby 3
INSERT INTO "User" (id, name, email, role, "createdAt", "updatedAt")
VALUES ('new_user_ansobad', 'An So Bad#2007', 'ansobad@guest.sbltcup', 'PLAYER', NOW(), NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Player" (id, ign, "userId", "isGuest", "createdAt")
VALUES ('new_player_ansobad', 'An So Bad#2007', 'new_user_ansobad', true, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Registration" (id, "tournamentId", "playerId", status, "registeredAt", "checkedIn", "checkInTime", "updatedAt")
VALUES ('new_reg_ansobad', 'cmou1dbcz0002o5e3udki0i2k', 'new_player_ansobad', 'APPROVED', NOW(), true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Meepsk1es#NTL → Lobby 5
INSERT INTO "User" (id, name, email, role, "createdAt", "updatedAt")
VALUES ('new_user_meepskies', 'Meepsk1es#NTL', 'meepskies@guest.sbltcup', 'PLAYER', NOW(), NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Player" (id, ign, "userId", "isGuest", "createdAt")
VALUES ('new_player_meepskies', 'Meepsk1es#NTL', 'new_user_meepskies', true, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Registration" (id, "tournamentId", "playerId", status, "registeredAt", "checkedIn", "checkInTime", "updatedAt")
VALUES ('new_reg_meepskies', 'cmou1dbcz0002o5e3udki0i2k', 'new_player_meepskies', 'APPROVED', NOW(), true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Little Daizy#PT1 → Lobby 5
INSERT INTO "User" (id, name, email, role, "createdAt", "updatedAt")
VALUES ('new_user_littledaizy', 'Little Daizy#PT1', 'littledaizy@guest.sbltcup', 'PLAYER', NOW(), NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Player" (id, ign, "userId", "isGuest", "createdAt")
VALUES ('new_player_littledaizy', 'Little Daizy#PT1', 'new_user_littledaizy', true, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Registration" (id, "tournamentId", "playerId", status, "registeredAt", "checkedIn", "checkInTime", "updatedAt")
VALUES ('new_reg_littledaizy', 'cmou1dbcz0002o5e3udki0i2k', 'new_player_littledaizy', 'APPROVED', NOW(), true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Thợ Kim Ngưu#2407 → Lobby 5
INSERT INTO "User" (id, name, email, role, "createdAt", "updatedAt")
VALUES ('new_user_thokimnguu', 'Thợ Kim Ngưu#2407', 'thokimnguu@guest.sbltcup', 'PLAYER', NOW(), NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Player" (id, ign, "userId", "isGuest", "createdAt")
VALUES ('new_player_thokimnguu', 'Thợ Kim Ngưu#2407', 'new_user_thokimnguu', true, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Registration" (id, "tournamentId", "playerId", status, "registeredAt", "checkedIn", "checkInTime", "updatedAt")
VALUES ('new_reg_thokimnguu', 'cmou1dbcz0002o5e3udki0i2k', 'new_player_thokimnguu', 'APPROVED', NOW(), true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- E là không thể #0204 → Lobby 8
INSERT INTO "User" (id, name, email, role, "createdAt", "updatedAt")
VALUES ('new_user_ekhongthe', 'E là không thể #0204', 'ekhongthe@guest.sbltcup', 'PLAYER', NOW(), NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Player" (id, ign, "userId", "isGuest", "createdAt")
VALUES ('new_player_ekhongthe', 'E là không thể #0204', 'new_user_ekhongthe', true, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Registration" (id, "tournamentId", "playerId", status, "registeredAt", "checkedIn", "checkInTime", "updatedAt")
VALUES ('new_reg_ekhongthe', 'cmou1dbcz0002o5e3udki0i2k', 'new_player_ekhongthe', 'APPROVED', NOW(), true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Long Dragon#1992 → Lobby 8
INSERT INTO "User" (id, name, email, role, "createdAt", "updatedAt")
VALUES ('new_user_longdragon', 'Long Dragon#1992', 'longdragon@guest.sbltcup', 'PLAYER', NOW(), NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Player" (id, ign, "userId", "isGuest", "createdAt")
VALUES ('new_player_longdragon', 'Long Dragon#1992', 'new_user_longdragon', true, NOW())
ON CONFLICT DO NOTHING;
INSERT INTO "Registration" (id, "tournamentId", "playerId", status, "registeredAt", "checkedIn", "checkInTime", "updatedAt")
VALUES ('new_reg_longdragon', 'cmou1dbcz0002o5e3udki0i2k', 'new_player_longdragon', 'APPROVED', NOW(), true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ── Step 2: Remove old GroupPlayer records ──
DELETE FROM "GroupPlayer" WHERE id IN (
  'cmp87t93000699he34nvvw7ju',  -- MrTy#Yuno from Lobby 3
  'cmp87t93000679he3lovo87m6',  -- Piggy#0707 from Lobby 3
  'cmp87t94y006o9he3glgua0ai',  -- Bakkies Roll Đen#NTL from Lobby 5
  'cmp87t94y006p9he35wmhhie4',  -- Thienny#vn2 from Lobby 5
  'cmp87t94y006q9he3zrmkxg72',  -- TrungNguyen#257 from Lobby 5
  'cmp87t97u007b9he335yb5im1',  -- Arizona K#2607 from Lobby 8
  'cmp87t97u007c9he33otm44ly'   -- DAT O9 TFT#88888 from Lobby 8
);

-- ── Step 3: Create new GroupPlayer records ──
-- GroupPlayer: id, groupId, playerId, totalPoints, finalRank
INSERT INTO "GroupPlayer" (id, "groupId", "playerId", "totalPoints") VALUES
('new_gp_edat',       'cmp6rybrr000blqe38jx1uf1r', 'new_player_edat',       0),
('new_gp_ansobad',    'cmp6rybrr000blqe38jx1uf1r', 'new_player_ansobad',    0),
('new_gp_meepskies',  'cmp6rybpn0008lee3b11vxlzt', 'new_player_meepskies',  0),
('new_gp_littledaizy','cmp6rybpn0008lee3b11vxlzt', 'new_player_littledaizy',0),
('new_gp_thokimnguu', 'cmp6rybpn0008lee3b11vxlzt', 'new_player_thokimnguu', 0),
('new_gp_ekhongthe',  'cmp6rybso000elee3lrnfxke8', 'new_player_ekhongthe',  0),
('new_gp_longdragon', 'cmp6rybso000elee3lrnfxke8', 'new_player_longdragon', 0)
ON CONFLICT DO NOTHING;

-- ── Step 4: Insert GameResult records ──
-- Using temp table approach

CREATE TEMP TABLE _gr (
  ign TEXT,
  game_id TEXT,
  placement INT,
  points INT
);

-- Lobby 1
INSERT INTO _gr VALUES
('1TTĐ TFT#1TTD',       'cmp87t8xl00539he3l1sv9uv1', 1, 8),('1TTĐ TFT#1TTD',       'cmp87t8xo00549he3eioj08a8', 5, 4),('1TTĐ TFT#1TTD',       'cmp87t8xx00559he30a8b8yjw', 5, 4),
('Chú Khỉ Buồn #0303',  'cmp87t8xl00539he3l1sv9uv1', 8, 1),('Chú Khỉ Buồn #0303',  'cmp87t8xo00549he3eioj08a8', 4, 5),('Chú Khỉ Buồn #0303',  'cmp87t8xx00559he30a8b8yjw', 7, 2),
('Sb VietHa#0711',       'cmp87t8xl00539he3l1sv9uv1', 3, 6),('Sb VietHa#0711',       'cmp87t8xo00549he3eioj08a8', 6, 3),('Sb VietHa#0711',       'cmp87t8xx00559he30a8b8yjw', 2, 7),
('Kharik#1403',          'cmp87t8xl00539he3l1sv9uv1', 4, 5),('Kharik#1403',          'cmp87t8xo00549he3eioj08a8', 7, 2),('Kharik#1403',          'cmp87t8xx00559he30a8b8yjw', 6, 3),
('Lil Wasianverson#TPC', 'cmp87t8xl00539he3l1sv9uv1', 2, 7),('Lil Wasianverson#TPC', 'cmp87t8xo00549he3eioj08a8', 8, 1),('Lil Wasianverson#TPC', 'cmp87t8xx00559he30a8b8yjw', 8, 1),
('nguyenvux#vux',        'cmp87t8xl00539he3l1sv9uv1', 7, 2),('nguyenvux#vux',        'cmp87t8xo00549he3eioj08a8', 1, 8),('nguyenvux#vux',        'cmp87t8xx00559he30a8b8yjw', 1, 8),
('MF L3m0nss#0810',     'cmp87t8xl00539he3l1sv9uv1', 6, 3),('MF L3m0nss#0810',     'cmp87t8xo00549he3eioj08a8', 3, 6),('MF L3m0nss#0810',     'cmp87t8xx00559he30a8b8yjw', 4, 5),
('ndn1#376',             'cmp87t8xl00539he3l1sv9uv1', 5, 4),('ndn1#376',             'cmp87t8xo00549he3eioj08a8', 2, 7),('ndn1#376',             'cmp87t8xx00559he30a8b8yjw', 3, 6);

-- Lobby 2
INSERT INTO _gr VALUES
('Lợi Nguyễnn1#2002',    'cmp87t8y400569he3s95du5kb', 7, 2),('Lợi Nguyễnn1#2002',    'cmp87t8ya00579he3rysns82l', 8, 1),('Lợi Nguyễnn1#2002',    'cmp87t8yd00589he37u65clsw', 3, 6),
('fury#lth',              'cmp87t8y400569he3s95du5kb', 4, 5),('fury#lth',              'cmp87t8ya00579he3rysns82l', 5, 4),('fury#lth',              'cmp87t8yd00589he37u65clsw', 7, 2),
('TMI Thắng Ngọt#0512',  'cmp87t8y400569he3s95du5kb', 5, 4),('TMI Thắng Ngọt#0512',  'cmp87t8ya00579he3rysns82l', 2, 7),('TMI Thắng Ngọt#0512',  'cmp87t8yd00589he37u65clsw', 6, 3),
('monkeydmessi#tle',      'cmp87t8y400569he3s95du5kb', 6, 3),('monkeydmessi#tle',      'cmp87t8ya00579he3rysns82l', 7, 2),('monkeydmessi#tle',      'cmp87t8yd00589he37u65clsw', 8, 1),
('KOS LifeSquare#2265',   'cmp87t8y400569he3s95du5kb', 2, 7),('KOS LifeSquare#2265',   'cmp87t8ya00579he3rysns82l', 3, 6),('KOS LifeSquare#2265',   'cmp87t8yd00589he37u65clsw', 1, 8),
('QDat#tqd',              'cmp87t8y400569he3s95du5kb', 1, 8),('QDat#tqd',              'cmp87t8ya00579he3rysns82l', 4, 5),('QDat#tqd',              'cmp87t8yd00589he37u65clsw', 5, 4),
('Mendes#0803',           'cmp87t8y400569he3s95du5kb', 8, 1),('Mendes#0803',           'cmp87t8ya00579he3rysns82l', 1, 8),('Mendes#0803',           'cmp87t8yd00589he37u65clsw', 2, 7),
('MF Creeper#CKTG',      'cmp87t8y400569he3s95du5kb', 3, 6),('MF Creeper#CKTG',      'cmp87t8ya00579he3rysns82l', 6, 3),('MF Creeper#CKTG',      'cmp87t8yd00589he37u65clsw', 4, 5);

-- Lobby 3
INSERT INTO _gr VALUES
('Em Đạt Ixtal #2803',     'cmp87t8yl00599he3bayzp3y5', 7, 2),('Em Đạt Ixtal #2803',     'cmp87t8yr005a9he3091p485i', 8, 1),('Em Đạt Ixtal #2803',     'cmp87t8yu005b9he3e7808ui7', 7, 2),
('Just a Chill Guy#3102',   'cmp87t8yl00599he3bayzp3y5', 8, 1),('Just a Chill Guy#3102',   'cmp87t8yr005a9he3091p485i', 5, 4),('Just a Chill Guy#3102',   'cmp87t8yu005b9he3e7808ui7', 5, 4),
('An So Bad#2007',          'cmp87t8yl00599he3bayzp3y5', 6, 3),('An So Bad#2007',          'cmp87t8yr005a9he3091p485i', 6, 3),('An So Bad#2007',          'cmp87t8yu005b9he3e7808ui7', 8, 1),
('Dante#LTD',               'cmp87t8yl00599he3bayzp3y5', 3, 6),('Dante#LTD',               'cmp87t8yr005a9he3091p485i', 1, 8),('Dante#LTD',               'cmp87t8yu005b9he3e7808ui7', 6, 3),
('SSC Jktft#JKTFT',         'cmp87t8yl00599he3bayzp3y5', 4, 5),('SSC Jktft#JKTFT',         'cmp87t8yr005a9he3091p485i', 4, 5),('SSC Jktft#JKTFT',         'cmp87t8yu005b9he3e7808ui7', 3, 6),
('SBLT DươngTB#1999',       'cmp87t8yl00599he3bayzp3y5', 5, 4),('SBLT DươngTB#1999',       'cmp87t8yr005a9he3091p485i', 7, 2),('SBLT DươngTB#1999',       'cmp87t8yu005b9he3e7808ui7', 4, 5),
('Tqt1#1709',               'cmp87t8yl00599he3bayzp3y5', 1, 8),('Tqt1#1709',               'cmp87t8yr005a9he3091p485i', 3, 6),('Tqt1#1709',               'cmp87t8yu005b9he3e7808ui7', 2, 7),
('MeoM3o#3636',             'cmp87t8yl00599he3bayzp3y5', 2, 7),('MeoM3o#3636',             'cmp87t8yr005a9he3091p485i', 2, 7),('MeoM3o#3636',             'cmp87t8yu005b9he3e7808ui7', 1, 8);

-- Lobby 4
INSERT INTO _gr VALUES
('TheHungMVP #CTP',          'cmp87t8z0005c9he3rbhaah4i', 7, 2),('TheHungMVP #CTP',          'cmp87t8z6005d9he3tolo4gtd', 3, 6),('TheHungMVP #CTP',          'cmp87t8zb005e9he3qackx30d', 2, 7),
('MCN1#2710',                'cmp87t8z0005c9he3rbhaah4i', 3, 6),('MCN1#2710',                'cmp87t8z6005d9he3tolo4gtd', 8, 1),('MCN1#2710',                'cmp87t8zb005e9he3qackx30d', 5, 4),
('EA7 Gnut#2004',            'cmp87t8z0005c9he3rbhaah4i', 2, 7),('EA7 Gnut#2004',            'cmp87t8z6005d9he3tolo4gtd', 2, 7),('EA7 Gnut#2004',            'cmp87t8zb005e9he3qackx30d', 6, 3),
('OolongTime#VNM',           'cmp87t8z0005c9he3rbhaah4i', 5, 4),('OolongTime#VNM',           'cmp87t8z6005d9he3tolo4gtd', 4, 5),('OolongTime#VNM',           'cmp87t8zb005e9he3qackx30d', 7, 2),
('tdha2004qn#goat',          'cmp87t8z0005c9he3rbhaah4i', 8, 1),('tdha2004qn#goat',          'cmp87t8z6005d9he3tolo4gtd', 6, 3),('tdha2004qn#goat',          'cmp87t8zb005e9he3qackx30d', 8, 1),
('SSC MissyuKC#0112',        'cmp87t8z0005c9he3rbhaah4i', 1, 8),('SSC MissyuKC#0112',        'cmp87t8z6005d9he3tolo4gtd', 5, 4),('SSC MissyuKC#0112',        'cmp87t8zb005e9he3qackx30d', 3, 6),
('TXD bugi gaming1#1410',    'cmp87t8z0005c9he3rbhaah4i', 4, 5),('TXD bugi gaming1#1410',    'cmp87t8z6005d9he3tolo4gtd', 7, 2),('TXD bugi gaming1#1410',    'cmp87t8zb005e9he3qackx30d', 4, 5),
('Lugh1 Prime#2703',         'cmp87t8z0005c9he3rbhaah4i', 6, 3),('Lugh1 Prime#2703',         'cmp87t8z6005d9he3tolo4gtd', 1, 8),('Lugh1 Prime#2703',         'cmp87t8zb005e9he3qackx30d', 1, 8);

-- Lobby 5
INSERT INTO _gr VALUES
('Arizona T#1802',           'cmp87t8zn005f9he3rkfda2uw', 7, 2),('Arizona T#1802',           'cmp87t8zt005g9he3ulxztf7e', 1, 8),('Arizona T#1802',           'cmp87t8zy005h9he3qoczk8xp', 2, 7),
('Meepsk1es#NTL',            'cmp87t8zn005f9he3rkfda2uw', 5, 4),('Meepsk1es#NTL',            'cmp87t8zt005g9he3ulxztf7e', 8, 1),('Meepsk1es#NTL',            'cmp87t8zy005h9he3qoczk8xp', 7, 2),
('Little Daizy#PT1',         'cmp87t8zn005f9he3rkfda2uw', 8, 1),('Little Daizy#PT1',         'cmp87t8zt005g9he3ulxztf7e', 6, 3),('Little Daizy#PT1',         'cmp87t8zy005h9he3qoczk8xp', 5, 4),
('Thợ Kim Ngưu#2407',       'cmp87t8zn005f9he3rkfda2uw', 4, 5),('Thợ Kim Ngưu#2407',       'cmp87t8zt005g9he3ulxztf7e', 4, 5),('Thợ Kim Ngưu#2407',       'cmp87t8zy005h9he3qoczk8xp', 6, 3),
('Tú Đội Trưởngg#1109',    'cmp87t8zn005f9he3rkfda2uw', 2, 7),('Tú Đội Trưởngg#1109',    'cmp87t8zt005g9he3ulxztf7e', 3, 6),('Tú Đội Trưởngg#1109',    'cmp87t8zy005h9he3qoczk8xp', 4, 5),
('Tuấn Trọc Gialai#cuto',  'cmp87t8zn005f9he3rkfda2uw', 1, 8),('Tuấn Trọc Gialai#cuto',  'cmp87t8zt005g9he3ulxztf7e', 5, 4),('Tuấn Trọc Gialai#cuto',  'cmp87t8zy005h9he3qoczk8xp', 3, 6),
('Hết Kẹo Rồi#iuem',       'cmp87t8zn005f9he3rkfda2uw', 3, 6),('Hết Kẹo Rồi#iuem',       'cmp87t8zt005g9he3ulxztf7e', 7, 2),('Hết Kẹo Rồi#iuem',       'cmp87t8zy005h9he3qoczk8xp', 1, 8),
('docQ#Elsu',               'cmp87t8zn005f9he3rkfda2uw', 6, 3),('docQ#Elsu',               'cmp87t8zt005g9he3ulxztf7e', 2, 7),('docQ#Elsu',               'cmp87t8zy005h9he3qoczk8xp', 8, 1);

-- Lobby 6
INSERT INTO _gr VALUES
('Vương Lâm#hzzzz',    'cmp87t904005i9he385jbe4z1', 7, 2),('Vương Lâm#hzzzz',    'cmp87t907005j9he3ecpr65ij', 7, 2),('Vương Lâm#hzzzz',    'cmp87t90a005k9he3wwwngryx', 8, 1),
('MF h1ha#mhieu',      'cmp87t904005i9he385jbe4z1', 3, 6),('MF h1ha#mhieu',      'cmp87t907005j9he3ecpr65ij', 1, 8),('MF h1ha#mhieu',      'cmp87t90a005k9he3wwwngryx', 1, 8),
('DDC1#DDC2',           'cmp87t904005i9he385jbe4z1', 6, 3),('DDC1#DDC2',           'cmp87t907005j9he3ecpr65ij', 3, 6),('DDC1#DDC2',           'cmp87t90a005k9he3wwwngryx', 4, 5),
('Jos Min Hieu#242',    'cmp87t904005i9he385jbe4z1', 2, 7),('Jos Min Hieu#242',    'cmp87t907005j9he3ecpr65ij', 2, 7),('Jos Min Hieu#242',    'cmp87t90a005k9he3wwwngryx', 3, 6),
('EM RA CHƯA#2093',     'cmp87t904005i9he385jbe4z1', 8, 1),('EM RA CHƯA#2093',     'cmp87t907005j9he3ecpr65ij', 8, 1),('EM RA CHƯA#2093',     'cmp87t90a005k9he3wwwngryx', 7, 2),
('Is Baileys#vie',      'cmp87t904005i9he385jbe4z1', 1, 8),('Is Baileys#vie',      'cmp87t907005j9he3ecpr65ij', 4, 5),('Is Baileys#vie',      'cmp87t90a005k9he3wwwngryx', 5, 4),
('Beckem291#777',       'cmp87t904005i9he385jbe4z1', 5, 4),('Beckem291#777',       'cmp87t907005j9he3ecpr65ij', 6, 3),('Beckem291#777',       'cmp87t90a005k9he3wwwngryx', 2, 7),
('Lamoon#Sahur',        'cmp87t904005i9he385jbe4z1', 4, 5),('Lamoon#Sahur',        'cmp87t907005j9he3ecpr65ij', 5, 4),('Lamoon#Sahur',        'cmp87t90a005k9he3wwwngryx', 6, 3);

-- Lobby 7
INSERT INTO _gr VALUES
('Cafe Nhân Phẩm#CFNP',  'cmp87t90d005l9he3ro7gynhn', 7, 2),('Cafe Nhân Phẩm#CFNP',  'cmp87t90e005m9he36vt35sdz', 6, 3),('Cafe Nhân Phẩm#CFNP',  'cmp87t90i005n9he3ruc8p006', 8, 1),
('SW yuipp#0522',        'cmp87t90d005l9he3ro7gynhn', 4, 5),('SW yuipp#0522',        'cmp87t90e005m9he36vt35sdz', 1, 8),('SW yuipp#0522',        'cmp87t90i005n9he3ruc8p006', 6, 3),
('MF wptczzz#0904',     'cmp87t90d005l9he3ro7gynhn', 2, 7),('MF wptczzz#0904',     'cmp87t90e005m9he36vt35sdz', 7, 2),('MF wptczzz#0904',     'cmp87t90i005n9he3ruc8p006', 1, 8),
('Vanitas#0711',         'cmp87t90d005l9he3ro7gynhn', 5, 4),('Vanitas#0711',         'cmp87t90e005m9he36vt35sdz', 4, 5),('Vanitas#0711',         'cmp87t90i005n9he3ruc8p006', 2, 7),
('BTS Chuối#HBC',       'cmp87t90d005l9he3ro7gynhn', 8, 1),('BTS Chuối#HBC',       'cmp87t90e005m9he36vt35sdz', 5, 4),('BTS Chuối#HBC',       'cmp87t90i005n9he3ruc8p006', 7, 2),
('Emperor 大国王#1111', 'cmp87t90d005l9he3ro7gynhn', 3, 6),('Emperor 大国王#1111', 'cmp87t90e005m9he36vt35sdz', 3, 6),('Emperor 大国王#1111', 'cmp87t90i005n9he3ruc8p006', 3, 6),
('DR Chase#0612',        'cmp87t90d005l9he3ro7gynhn', 6, 3),('DR Chase#0612',        'cmp87t90e005m9he36vt35sdz', 8, 1),('DR Chase#0612',        'cmp87t90i005n9he3ruc8p006', 4, 5),
('ironsoap#2510',        'cmp87t90d005l9he3ro7gynhn', 1, 8),('ironsoap#2510',        'cmp87t90e005m9he36vt35sdz', 2, 7),('ironsoap#2510',        'cmp87t90i005n9he3ruc8p006', 5, 4);

-- Lobby 8
INSERT INTO _gr VALUES
('E là không thể #0204', 'cmp87t90l005o9he3p38ncxk2', 4, 5),('E là không thể #0204', 'cmp87t90m005p9he3i4bwyl6f', 4, 5),('E là không thể #0204', 'cmp87t90o005q9he3yy4tapin', 4, 5),
('Long Dragon#1992',     'cmp87t90l005o9he3p38ncxk2', 8, 1),('Long Dragon#1992',     'cmp87t90m005p9he3i4bwyl6f', 8, 1),('Long Dragon#1992',     'cmp87t90o005q9he3yy4tapin', 6, 3),
('Gà Trống Hoa Mơ#1204','cmp87t90l005o9he3p38ncxk2', 1, 8),('Gà Trống Hoa Mơ#1204','cmp87t90m005p9he3i4bwyl6f', 7, 2),('Gà Trống Hoa Mơ#1204','cmp87t90o005q9he3yy4tapin', 3, 6),
('Khánh Calm Down#1410', 'cmp87t90l005o9he3p38ncxk2', 6, 3),('Khánh Calm Down#1410', 'cmp87t90m005p9he3i4bwyl6f', 6, 3),('Khánh Calm Down#1410', 'cmp87t90o005q9he3yy4tapin', 1, 8),
('MenghardAPAC#2010',    'cmp87t90l005o9he3p38ncxk2', 3, 6),('MenghardAPAC#2010',    'cmp87t90m005p9he3i4bwyl6f', 5, 4),('MenghardAPAC#2010',    'cmp87t90o005q9he3yy4tapin', 8, 1),
('Đừng Mà#1111',         'cmp87t90l005o9he3p38ncxk2', 5, 4),('Đừng Mà#1111',         'cmp87t90m005p9he3i4bwyl6f', 3, 6),('Đừng Mà#1111',         'cmp87t90o005q9he3yy4tapin', 5, 4),
('Pythrasse#1545',       'cmp87t90l005o9he3p38ncxk2', 2, 7),('Pythrasse#1545',       'cmp87t90m005p9he3i4bwyl6f', 2, 7),('Pythrasse#1545',       'cmp87t90o005q9he3yy4tapin', 7, 2),
('puppy2fast#1521',      'cmp87t90l005o9he3p38ncxk2', 7, 2),('puppy2fast#1521',      'cmp87t90m005p9he3i4bwyl6f', 1, 8),('puppy2fast#1521',      'cmp87t90o005q9he3yy4tapin', 2, 7);

-- Insert GameResult from temp table
INSERT INTO "GameResult" (id, "gameId", "playerId", placement, points)
SELECT
  'gr_' || md5(row_number() OVER ()::text || clock_timestamp()::text)::text,
  gr.game_id,
  p.id,
  gr.placement,
  gr.points
FROM _gr gr
JOIN "Player" p ON p.ign = gr.ign;

DROP TABLE _gr;

-- ── Step 5: Update Game status → COMPLETED ──
UPDATE "Game" SET status = 'COMPLETED'
WHERE id IN (
  'cmp87t8xl00539he3l1sv9uv1','cmp87t8xo00549he3eioj08a8','cmp87t8xx00559he30a8b8yjw',
  'cmp87t8y400569he3s95du5kb','cmp87t8ya00579he3rysns82l','cmp87t8yd00589he37u65clsw',
  'cmp87t8yl00599he3bayzp3y5','cmp87t8yr005a9he3091p485i','cmp87t8yu005b9he3e7808ui7',
  'cmp87t8z0005c9he3rbhaah4i','cmp87t8z6005d9he3tolo4gtd','cmp87t8zb005e9he3qackx30d',
  'cmp87t8zn005f9he3rkfda2uw','cmp87t8zt005g9he3ulxztf7e','cmp87t8zy005h9he3qoczk8xp',
  'cmp87t904005i9he385jbe4z1','cmp87t907005j9he3ecpr65ij','cmp87t90a005k9he3wwwngryx',
  'cmp87t90d005l9he3ro7gynhn','cmp87t90e005m9he36vt35sdz','cmp87t90i005n9he3ruc8p006',
  'cmp87t90l005o9he3p38ncxk2','cmp87t90m005p9he3i4bwyl6f','cmp87t90o005q9he3yy4tapin'
);

-- ── Step 6: Update GroupPlayer totalPoints ──
UPDATE "GroupPlayer" gp
SET "totalPoints" = (
  SELECT COALESCE(SUM(gr.points), 0)
  FROM "GameResult" gr
  JOIN "Game" g ON gr."gameId" = g.id
  WHERE gr."playerId" = gp."playerId"
    AND g."groupId" = gp."groupId"
)
WHERE gp."groupId" IN (
  'cmp6rybr8000alee3r1r3peep',
  'cmp6rybri000blee3sxpe1vf1',
  'cmp6rybrr000blqe38jx1uf1r',
  'cmp6rybq50008lqe37i1wbjdz',
  'cmp6rybpn0008lee3b11vxlzt',
  'cmp6rybu7000elqe33b8bvoqp',
  'cmp6rybrg000alqe3yics363n',
  'cmp6rybso000elee3lrnfxke8'
);

COMMIT;

-- ── Verification ──
SELECT 'Total GameResults' as metric, COUNT(*) as value
FROM "GameResult" gr
JOIN "Game" g ON gr."gameId" = g.id
JOIN "Group" grp ON g."groupId" = grp.id
WHERE grp."stageId" = 'cmou1dbcz0002o5e3udki0i2k-stage-1';
