import {
  passwordSchema,
  registerSchema,
  tournamentCreateSchema,
  tournamentUpdateSchema,
  registrationSchema,
  disputeCreateSchema,
  disputeUpdateSchema,
  announcementCreateSchema,
  announcementUpdateSchema,
  commentCreateSchema,
  gameResultSchema,
  predictionEntrySchema,
  predictionSchema,
  notificationReadSchema,
  userUpdateSchema,
  paginationSchema,
} from "@/lib/validations";

describe("passwordSchema", () => {
  test("accepts valid password", () => {
    expect(passwordSchema.safeParse("Abcdef1x").success).toBe(true);
  });

  test("rejects too short", () => {
    expect(passwordSchema.safeParse("Ab1x").success).toBe(false);
  });

  test("rejects missing uppercase", () => {
    expect(passwordSchema.safeParse("abcdef1x").success).toBe(false);
  });

  test("rejects missing lowercase", () => {
    expect(passwordSchema.safeParse("ABCDEF1X").success).toBe(false);
  });

  test("rejects missing digit", () => {
    expect(passwordSchema.safeParse("Abcdefgh").success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = { email: "a@b.com", password: "Abcdef1x", name: "Test", ign: "Player" };

  test("accepts valid input", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects invalid email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "bad" }).success).toBe(false);
  });

  test("rejects short name", () => {
    expect(registerSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });
});

describe("tournamentCreateSchema", () => {
  const valid = { name: "Tournament", season: 1, maxPlayers: 8 };

  test("accepts minimal valid input", () => {
    expect(tournamentCreateSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects missing name", () => {
    expect(tournamentCreateSchema.safeParse({ season: 1, maxPlayers: 8 }).success).toBe(false);
  });

  test("rejects maxPlayers below 2", () => {
    expect(tournamentCreateSchema.safeParse({ ...valid, maxPlayers: 1 }).success).toBe(false);
  });
});

describe("tournamentUpdateSchema", () => {
  test("accepts partial input", () => {
    expect(tournamentUpdateSchema.safeParse({ name: "Updated" }).success).toBe(true);
  });

  test("accepts empty object", () => {
    expect(tournamentUpdateSchema.safeParse({}).success).toBe(true);
  });
});

describe("registrationSchema", () => {
  test("accepts empty object", () => {
    expect(registrationSchema.safeParse({}).success).toBe(true);
  });

  test("accepts with notes", () => {
    expect(registrationSchema.safeParse({ notes: "Hello" }).success).toBe(true);
  });
});

describe("disputeCreateSchema", () => {
  const valid = { tournamentId: "t1", reason: "SCORING_ERROR" as const, description: "Score was wrong" };

  test("accepts valid input", () => {
    expect(disputeCreateSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects short description", () => {
    expect(disputeCreateSchema.safeParse({ ...valid, description: "short" }).success).toBe(false);
  });

  test("rejects invalid reason", () => {
    expect(disputeCreateSchema.safeParse({ ...valid, reason: "INVALID" }).success).toBe(false);
  });
});

describe("disputeUpdateSchema", () => {
  test("accepts valid status", () => {
    expect(disputeUpdateSchema.safeParse({ status: "RESOLVED" }).success).toBe(true);
  });

  test("accepts empty object", () => {
    expect(disputeUpdateSchema.safeParse({}).success).toBe(true);
  });
});

describe("announcementCreateSchema", () => {
  const valid = { title: "Hello", content: "World", type: "GENERAL" as const };

  test("accepts valid input", () => {
    expect(announcementCreateSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects empty title", () => {
    expect(announcementCreateSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
  });
});

describe("announcementUpdateSchema", () => {
  test("accepts partial input", () => {
    expect(announcementUpdateSchema.safeParse({ title: "Updated" }).success).toBe(true);
  });
});

describe("commentCreateSchema", () => {
  test("accepts valid comment", () => {
    expect(commentCreateSchema.safeParse({ content: "Nice!" }).success).toBe(true);
  });

  test("rejects empty content", () => {
    expect(commentCreateSchema.safeParse({ content: "" }).success).toBe(false);
  });
});

describe("gameResultSchema", () => {
  test("accepts valid results", () => {
    expect(gameResultSchema.safeParse({
      results: [
        { playerId: "p1", placement: 1 },
        { playerId: "p2", placement: 2 },
      ],
    }).success).toBe(true);
  });

  test("rejects single result", () => {
    expect(gameResultSchema.safeParse({
      results: [{ playerId: "p1", placement: 1 }],
    }).success).toBe(false);
  });

  test("rejects placement > 8", () => {
    expect(gameResultSchema.safeParse({
      results: [
        { playerId: "p1", placement: 1 },
        { playerId: "p2", placement: 9 },
      ],
    }).success).toBe(false);
  });
});

describe("predictionEntrySchema", () => {
  test("accepts valid entry", () => {
    expect(predictionEntrySchema.safeParse({
      groupId: "g1", rank1PlayerId: "p1", rank2PlayerId: "p2",
      rank3PlayerId: "p3", rank4PlayerId: "p4",
    }).success).toBe(true);
  });

  test("rejects missing rank", () => {
    expect(predictionEntrySchema.safeParse({
      groupId: "g1", rank1PlayerId: "p1", rank2PlayerId: "p2",
      rank3PlayerId: "p3", rank4PlayerId: "",
    }).success).toBe(false);
  });
});

describe("predictionSchema", () => {
  test("accepts valid prediction", () => {
    expect(predictionSchema.safeParse({
      entries: [{
        groupId: "g1", rank1PlayerId: "p1", rank2PlayerId: "p2",
        rank3PlayerId: "p3", rank4PlayerId: "p4",
      }],
    }).success).toBe(true);
  });

  test("rejects empty entries", () => {
    expect(predictionSchema.safeParse({ entries: [] }).success).toBe(false);
  });
});

describe("notificationReadSchema", () => {
  test("accepts with id", () => {
    expect(notificationReadSchema.safeParse({ id: "n1" }).success).toBe(true);
  });

  test("accepts with all flag", () => {
    expect(notificationReadSchema.safeParse({ all: true }).success).toBe(true);
  });

  test("accepts empty object", () => {
    expect(notificationReadSchema.safeParse({}).success).toBe(true);
  });
});

describe("userUpdateSchema", () => {
  test("accepts valid update", () => {
    expect(userUpdateSchema.safeParse({ name: "New Name", role: "ADMIN" }).success).toBe(true);
  });

  test("accepts empty object", () => {
    expect(userUpdateSchema.safeParse({}).success).toBe(true);
  });
});

describe("paginationSchema", () => {
  test("accepts valid pagination", () => {
    expect(paginationSchema.safeParse({ page: "1", limit: "10" }).success).toBe(true);
  });

  test("rejects page < 1", () => {
    expect(paginationSchema.safeParse({ page: "0", limit: "10" }).success).toBe(false);
  });

  test("rejects limit > 100", () => {
    expect(paginationSchema.safeParse({ page: "1", limit: "101" }).success).toBe(false);
  });
});
