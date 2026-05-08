import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preference = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  // Return default preferences if none exist
  return Response.json(
    preference || {
      emailEnabled: true,
      pushEnabled: true,
      tournamentUpdates: true,
      matchResults: true,
      predictionScored: true,
      announcements: true,
      registrationStatus: true,
      checkInReminder: true,
    }
  );
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Validate all fields are boolean
  const booleanFields = [
    "emailEnabled", "pushEnabled", "tournamentUpdates", "matchResults",
    "predictionScored", "announcements", "registrationStatus", "checkInReminder",
  ];
  for (const field of booleanFields) {
    if (body[field] !== undefined && typeof body[field] !== "boolean") {
      return Response.json({ error: `${field} must be a boolean` }, { status: 400 });
    }
  }

  const preference = await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    update: {
      emailEnabled: body.emailEnabled,
      pushEnabled: body.pushEnabled,
      tournamentUpdates: body.tournamentUpdates,
      matchResults: body.matchResults,
      predictionScored: body.predictionScored,
      announcements: body.announcements,
      registrationStatus: body.registrationStatus,
      checkInReminder: body.checkInReminder,
    },
    create: {
      userId: session.user.id,
      emailEnabled: body.emailEnabled ?? true,
      pushEnabled: body.pushEnabled ?? true,
      tournamentUpdates: body.tournamentUpdates ?? true,
      matchResults: body.matchResults ?? true,
      predictionScored: body.predictionScored ?? true,
      announcements: body.announcements ?? true,
      registrationStatus: body.registrationStatus ?? true,
      checkInReminder: body.checkInReminder ?? true,
    },
  });

  return Response.json(preference);
}
