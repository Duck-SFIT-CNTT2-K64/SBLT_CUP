#!/usr/bin/env python3
"""Fill game results for SBLT CUP Mùa 1 - Vòng Loại (QUALIFIER)."""
import psycopg2
import uuid
import sys

DB_URL = "postgresql://sblt_prod:SbltCup2026@Secure@localhost:5432/sblt_cup_prod"

# ── Lobby → Group ID mapping ──
GROUPS = {
    1: "cmp6rybr8000alee3r1r3peep",
    2: "cmp6rybri000blee3sxpe1vf1",
    3: "cmp6rybrr000blqe38jx1uf1r",
    4: "cmp6rybq50008lqe37i1wbjdz",
    5: "cmp6rybpn0008lee3b11vxlzt",
    6: "cmp6rybu7000elqe33b8bvoqp",
    7: "cmp6rybrg000alqe3yics363n",
    8: "cmp6rybso000elee3lrnfxke8",
}

# ── Game ID mapping (lobby → [game1, game2, game3]) ──
GAMES = {
    1: ["cmp87t8xl00539he3l1sv9uv1", "cmp87t8xo00549he3eioj08a8", "cmp87t8xx00559he30a8b8yjw"],
    2: ["cmp87t8y400569he3s95du5kb", "cmp87t8ya00579he3rysns82l", "cmp87t8yd00589he37u65clsw"],
    3: ["cmp87t8yl00599he3bayzp3y5", "cmp87t8yr005a9he3091p485i", "cmp87t8yu005b9he3e7808ui7"],
    4: ["cmp87t8z0005c9he3rbhaah4i", "cmp87t8z6005d9he3tolo4gtd", "cmp87t8zb005e9he3qackx30d"],
    5: ["cmp87t8zn005f9he3rkfda2uw", "cmp87t8zt005g9he3ulxztf7e", "cmp87t8zy005h9he3qoczk8xp"],
    6: ["cmp87t904005i9he385jbe4z1", "cmp87t907005j9he3ecpr65ij", "cmp87t90a005k9he3wwwngryx"],
    7: ["cmp87t90d005l9he3ro7gynhn", "cmp87t90e005m9he36vt35sdz", "cmp87t90i005n9he3ruc8p006"],
    8: ["cmp87t90l005o9he3p38ncxk2", "cmp87t90m005p9he3i4bwyl6f", "cmp87t90o005q9he3yy4tapin"],
}

TOURNAMENT_ID = "cmou1dbcz0002o5e3udki0i2k"
STAGE_ID = "cmou1dbcz0002o5e3udki0i2k-stage-1"

# ── User data: lobby → [(ign, placement_game1, points_game1, ...)] ──
# Format: (ign, g1_top, g1_pts, g2_top, g2_pts, g3_top, g3_pts, total)
LOBBY_DATA = {
    1: [
        ("1TTĐ TFT#1TTD", 1, 8, 5, 4, 5, 4, 16),
        ("Chú Khỉ Buồn #0303", 8, 1, 4, 5, 7, 2, 8),
        ("Sb VietHa#0711", 3, 6, 6, 3, 2, 7, 16),
        ("Kharik#1403", 4, 5, 7, 2, 6, 3, 10),
        ("Lil Wasianverson#TPC", 2, 7, 8, 1, 8, 1, 9),
        ("nguyenvux#vux", 7, 2, 1, 8, 1, 8, 18),
        ("MF L3m0nss#0810", 6, 3, 3, 6, 4, 5, 14),
        ("ndn1#376", 5, 4, 2, 7, 3, 6, 17),
    ],
    2: [
        ("Lợi Nguyễnn1#2002", 7, 2, 8, 1, 3, 6, 9),
        ("fury#lth", 4, 5, 5, 4, 7, 2, 11),
        ("TMI Thắng Ngọt#0512", 5, 4, 2, 7, 6, 3, 14),
        ("monkeydmessi#tle", 6, 3, 7, 2, 8, 1, 6),
        ("KOS LifeSquare#2265", 2, 7, 3, 6, 1, 8, 21),
        ("QDat#tqd", 1, 8, 4, 5, 5, 4, 17),
        ("Mendes#0803", 8, 1, 1, 8, 2, 7, 16),
        ("MF Creeper#CKTG", 3, 6, 6, 3, 4, 5, 14),
    ],
    3: [
        ("Em Đạt Ixtal #2803", 7, 2, 8, 1, 7, 2, 5),
        ("Just a Chill Guy#3102", 8, 1, 5, 4, 5, 4, 9),
        ("An So Bad#2007", 6, 3, 6, 3, 8, 1, 7),
        ("Dante#LTD", 3, 6, 1, 8, 6, 3, 17),
        ("SSC Jktft#JKTFT", 4, 5, 4, 5, 3, 6, 16),
        ("SBLT DươngTB#1999", 5, 4, 7, 2, 4, 5, 11),
        ("Tqt1#1709", 1, 8, 3, 6, 2, 7, 21),
        ("MeoM3o#3636", 2, 7, 2, 7, 1, 8, 22),
    ],
    4: [
        ("TheHungMVP #CTP", 7, 2, 3, 6, 2, 7, 15),
        ("MCN1#2710", 3, 6, 8, 1, 5, 4, 11),
        ("EA7 Gnut#2004", 2, 7, 2, 7, 6, 3, 17),
        ("OolongTime#VNM", 5, 4, 4, 5, 7, 2, 11),
        ("tdha2004qn#goat", 8, 1, 6, 3, 8, 1, 5),
        ("SSC MissyuKC#0112", 1, 8, 5, 4, 3, 6, 18),
        ("TXD bugi gaming1#1410", 4, 5, 7, 2, 4, 5, 12),
        ("Lugh1 Prime#2703", 6, 3, 1, 8, 1, 8, 19),
    ],
    5: [
        ("Arizona T#1802", 7, 2, 1, 8, 2, 7, 17),
        ("Meepsk1es#NTL", 5, 4, 8, 1, 7, 2, 7),
        ("Little Daizy#PT1", 8, 1, 6, 3, 5, 4, 8),
        ("Thợ Kim Ngưu#2407", 4, 5, 4, 5, 6, 3, 13),
        ("Tú Đội Trưởngg#1109", 2, 7, 3, 6, 4, 5, 18),
        ("Tuấn Trọc Gialai#cuto", 1, 8, 5, 4, 3, 6, 18),
        ("Hết Kẹo Rồi#iuem", 3, 6, 7, 2, 1, 8, 16),
        ("docQ#Elsu", 6, 3, 2, 7, 8, 1, 11),
    ],
    6: [
        ("Vương Lâm#hzzzz", 7, 2, 7, 2, 8, 1, 5),
        ("MF h1ha#mhieu", 3, 6, 1, 8, 1, 8, 22),
        ("DDC1#DDC2", 6, 3, 3, 6, 4, 5, 14),
        ("Jos Min Hieu#242", 2, 7, 2, 7, 3, 6, 20),
        ("EM RA CHƯA#2093", 8, 1, 8, 1, 7, 2, 4),
        ("Is Baileys#vie", 1, 8, 4, 5, 5, 4, 17),
        ("Beckem291#777", 5, 4, 6, 3, 2, 7, 14),
        ("Lamoon#Sahur", 4, 5, 5, 4, 6, 3, 12),
    ],
    7: [
        ("Cafe Nhân Phẩm#CFNP", 7, 2, 6, 3, 8, 1, 6),
        ("SW yuipp#0522", 4, 5, 1, 8, 6, 3, 16),
        ("MF wptczzz#0904", 2, 7, 7, 2, 1, 8, 17),
        ("Vanitas#0711", 5, 4, 4, 5, 2, 7, 16),
        ("BTS Chuối#HBC", 8, 1, 5, 4, 7, 2, 7),
        ("Emperor 大国王#1111", 3, 6, 3, 6, 3, 6, 18),
        ("DR Chase#0612", 6, 3, 8, 1, 4, 5, 9),
        ("ironsoap#2510", 1, 8, 2, 7, 5, 4, 19),
    ],
    8: [
        ("E là không thể #0204", 4, 5, 4, 5, 4, 5, 15),
        ("Long Dragon#1992", 8, 1, 8, 1, 6, 3, 5),
        ("Gà Trống Hoa Mơ#1204", 1, 8, 7, 2, 3, 6, 16),
        ("Khánh Calm Down#1410", 6, 3, 6, 3, 1, 8, 14),
        ("MenghardAPAC#2010", 3, 6, 5, 4, 8, 1, 11),
        ("Đừng Mà#1111", 5, 4, 3, 6, 5, 4, 14),
        ("Pythrasse#1545", 2, 7, 2, 7, 7, 2, 16),
        ("puppy2fast#1521", 7, 2, 1, 8, 2, 7, 17),
    ],
}

# ── Players to remove from lobbies ──
PLAYERS_TO_REMOVE = [
    ("MrTy#Yuno", "cmp87t93000699he34nvvw7ju"),
    ("Piggy#0707", "cmp87t93000679he3lovo87m6"),
    ("Bakkies Roll Đen#NTL", "cmp87t94y006o9he3glgua0ai"),
    ("Thienny#vn2", "cmp87t94y006p9he35wmhhie4"),
    ("TrungNguyen#257", "cmp87t94y006q9he3zrmkxg72"),
    ("Arizona K#2607", "cmp87t97u007b9he335yb5im1"),
    ("DAT O9 TFT#88888", "cmp87t97u007c9he33otm44ly"),
]

# ── New players to create ──
NEW_PLAYERS = [
    ("Em Đạt Ixtal #2803", 3),   # lobby
    ("An So Bad#2007", 3),
    ("Meepsk1es#NTL", 5),
    ("Little Daizy#PT1", 5),
    ("Thợ Kim Ngưu#2407", 5),
    ("E là không thể #0204", 8),
    ("Long Dragon#1992", 8),
]


def main():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # ── Step 1: Get existing player IDs ──
        print("Step 1: Loading existing player IDs...")
        all_igns = set()
        for lobby_data in LOBBY_DATA.values():
            for row in lobby_data:
                all_igns.add(row[0])

        cur.execute(
            'SELECT ign, id FROM "Player" WHERE ign = ANY(%s)',
            (list(all_igns),)
        )
        player_map = {ign: pid for ign, pid in cur.fetchall()}
        print(f"  Found {len(player_map)} existing players")

        # ── Step 2: Create new players ──
        print("Step 2: Creating new players...")
        for ign, lobby in NEW_PLAYERS:
            if ign in player_map:
                print(f"  Skipping {ign} (already exists)")
                continue

            user_id = str(uuid.uuid4())
            player_id = f"new_{uuid.uuid4().hex[:20]}"

            # Create User (guest, no email)
            cur.execute(
                '''INSERT INTO "User" (id, name, email, role, "createdAt", "updatedAt")
                   VALUES (%s, %s, %s, 'USER', NOW(), NOW())
                   ON CONFLICT DO NOTHING''',
                (user_id, ign, f"{uuid.uuid4().hex[:8]}@guest.sbltcup")
            )

            # Create Player
            cur.execute(
                '''INSERT INTO "Player" (id, ign, "userId", "isGuest", "createdAt", "updatedAt")
                   VALUES (%s, %s, %s, true, NOW(), NOW())''',
                (player_id, ign, user_id)
            )

            # Create Registration
            reg_id = f"reg_{uuid.uuid4().hex[:20]}"
            cur.execute(
                '''INSERT INTO "Registration" (id, "userId", "tournamentId", status, "checkedIn", "createdAt", "updatedAt")
                   VALUES (%s, %s, %s, 'APPROVED', true, NOW(), NOW())''',
                (reg_id, user_id, TOURNAMENT_ID)
            )

            player_map[ign] = player_id
            print(f"  Created: {ign} → {player_id}")

        # ── Step 3: Remove old GroupPlayer records ──
        print("Step 3: Removing old GroupPlayer records...")
        for ign, gp_id in PLAYERS_TO_REMOVE:
            cur.execute('DELETE FROM "GroupPlayer" WHERE id = %s', (gp_id,))
            print(f"  Removed: {ign} (gp: {gp_id})")

        # ── Step 4: Create new GroupPlayer records ──
        print("Step 4: Creating new GroupPlayer records...")
        for ign, lobby in NEW_PLAYERS:
            group_id = GROUPS[lobby]
            player_id = player_map[ign]
            gp_id = f"new_gp_{uuid.uuid4().hex[:20]}"

            cur.execute(
                '''INSERT INTO "GroupPlayer" (id, "groupId", "playerId", "totalPoints", "createdAt", "updatedAt")
                   VALUES (%s, %s, %s, 0, NOW(), NOW())
                   ON CONFLICT DO NOTHING''',
                (gp_id, group_id, player_id)
            )
            print(f"  Created: {ign} → Lobby {lobby}")

        # ── Step 5: Insert GameResult records ──
        print("Step 5: Inserting GameResult records...")
        result_count = 0
        for lobby_num, lobby_data in LOBBY_DATA.items():
            game_ids = GAMES[lobby_num]
            for row in lobby_data:
                ign = row[0]
                player_id = player_map.get(ign)
                if not player_id:
                    print(f"  WARNING: Player not found: {ign}")
                    continue

                for game_idx in range(3):
                    placement = row[1 + game_idx * 2]
                    points = row[2 + game_idx * 2]
                    game_id = game_ids[game_idx]
                    gr_id = f"gr_{uuid.uuid4().hex[:20]}"

                    cur.execute(
                        '''INSERT INTO "GameResult" (id, "gameId", "playerId", placement, points, "createdAt", "updatedAt")
                           VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                           ON CONFLICT DO NOTHING''',
                        (gr_id, game_id, player_id, placement, points)
                    )
                    result_count += 1

        print(f"  Inserted {result_count} GameResult records")

        # ── Step 6: Update Game status → COMPLETED ──
        print("Step 6: Updating Game status...")
        all_game_ids = [gid for games in GAMES.values() for gid in games]
        cur.execute(
            'UPDATE "Game" SET status = \'COMPLETED\', "updatedAt" = NOW() WHERE id = ANY(%s)',
            (all_game_ids,)
        )
        print(f"  Updated {cur.rowcount} games to COMPLETED")

        # ── Step 7: Update GroupPlayer totalPoints ──
        print("Step 7: Updating GroupPlayer totalPoints...")
        for lobby_num, group_id in GROUPS.items():
            cur.execute(
                '''UPDATE "GroupPlayer" gp
                   SET "totalPoints" = (
                     SELECT COALESCE(SUM(gr.points), 0)
                     FROM "GameResult" gr
                     JOIN "Game" g ON gr."gameId" = g.id
                     WHERE gr."playerId" = gp."playerId"
                       AND g."groupId" = gp."groupId"
                   ),
                   "updatedAt" = NOW()
                   WHERE gp."groupId" = %s''',
                (group_id,)
            )
            print(f"  Lobby {lobby_num}: updated {cur.rowcount} players")

        # ── Step 8: Verify ──
        print("\nStep 8: Verification...")
        cur.execute('SELECT COUNT(*) FROM "GameResult" gr JOIN "Game" g ON gr."gameId" = g.id JOIN "Group" grp ON g."groupId" = grp.id WHERE grp."stageId" = %s', (STAGE_ID,))
        total_results = cur.fetchone()[0]
        print(f"  Total GameResult records: {total_results} (expected: 192)")

        # Show top players per lobby
        for lobby_num in range(1, 9):
            group_id = GROUPS[lobby_num]
            cur.execute(
                '''SELECT p.ign, gp."totalPoints"
                   FROM "GroupPlayer" gp
                   JOIN "Player" p ON gp."playerId" = p.id
                   WHERE gp."groupId" = %s
                   ORDER BY gp."totalPoints" DESC''',
                (group_id,)
            )
            rows = cur.fetchall()
            print(f"\n  Lobby {lobby_num}:")
            for rank, (ign, pts) in enumerate(rows, 1):
                print(f"    {rank}. {ign}: {pts}pts")

        conn.commit()
        print("\n✅ Done! All data committed.")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
