import webPush from "web-push";
import { prisma } from "@/lib/prisma";

// Configure VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@sbltcup.com";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface PushPayload {
  title: string;
  message: string;
  link?: string;
  type?: string;
}

export async function sendPushNotification(
  userId: string,
  payload: PushPayload
) {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
    } catch (error: unknown) {
      // Remove expired/invalid subscriptions (410 Gone)
      if (error && typeof error === "object" && "statusCode" in error && error.statusCode === 410) {
        await prisma.pushSubscription.delete({
          where: { id: sub.id },
        });
      }
    }
  }
}

export async function sendBulkPushNotifications(
  userIds: string[],
  payload: PushPayload
) {
  if (!vapidPublicKey || !vapidPrivateKey || userIds.length === 0) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
    } catch (error: unknown) {
      if (error && typeof error === "object" && "statusCode" in error && error.statusCode === 410) {
        await prisma.pushSubscription.delete({
          where: { id: sub.id },
        });
      }
    }
  }
}
