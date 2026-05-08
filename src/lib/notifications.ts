import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationPreference } from "@prisma/client";
import nodemailer from "nodemailer";
import { sendPushNotification, sendBulkPushNotifications } from "@/lib/push";

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helpers
function escapeHtml(str: string): string {
  return str.replace(/[<>&"]/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" };
    return map[c] || c;
  });
}

function isValidLink(link: string): boolean {
  return link.startsWith("/") && !link.startsWith("//") && !link.includes(":");
}

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) {
  // Check user preferences
  const preference = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  // If preference exists, check if this type is enabled
  if (preference) {
    const typeMap: Record<NotificationType, keyof typeof preference> = {
      TOURNAMENT_UPDATE: "tournamentUpdates",
      MATCH_RESULT: "matchResults",
      PREDICTION_SCORED: "predictionScored",
      ANNOUNCEMENT: "announcements",
      REGISTRATION_STATUS: "registrationStatus",
      CHECK_IN_REMINDER: "checkInReminder",
    };

    const prefKey = typeMap[type];
    if (prefKey && !preference[prefKey]) {
      return null; // User has disabled this notification type
    }
  }

  // Validate link
  const safeLink = link && isValidLink(link) ? link : undefined;

  // Create notification in database
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link: safeLink,
    },
  });

  // Send email if enabled
  if (!preference || preference.emailEnabled) {
    await sendEmailNotification(userId, title, message, safeLink);
  }

  // Send push notification if enabled
  if (!preference || preference.pushEnabled) {
    sendPushNotification(userId, { title, message, link: safeLink, type }).catch(console.error);
  }

  return notification;
}

async function sendEmailNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user || !process.env.SMTP_USER) return;

    const baseUrl = process.env.NEXTAUTH_URL || "https://sbltcup.com";
    const fullLink = link ? `${baseUrl}${link}` : baseUrl;

    // Escape HTML to prevent XSS
    const safeTitle = escapeHtml(title);
    const safeMessage = escapeHtml(message);

    await transporter.sendMail({
      from: `"SBLT CUP" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `[SBLT CUP] ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SBLT CUP</h1>
          </div>
          <div style="background: #111; padding: 20px; border: 1px solid #222;">
            <h2 style="color: #f5f5f5; margin-top: 0;">${safeTitle}</h2>
            <p style="color: #888; line-height: 1.6;">${safeMessage}</p>
            ${link ? `<a href="${fullLink}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">Xem chi tiết</a>` : ''}
          </div>
          <div style="background: #0a0a0a; padding: 16px; text-align: center; border: 1px solid #222; border-top: none;">
            <p style="color: #555; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} SBLT CUP. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
}

// Batch version - fixes N+1 problem
export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
) {
  if (userIds.length === 0) return [];

  // Validate link once
  const safeLink = params.link && isValidLink(params.link) ? params.link : undefined;

  // Batch-load all preferences in 1 query
  const preferences = await prisma.notificationPreference.findMany({
    where: { userId: { in: userIds } },
  });
  const prefMap = new Map(preferences.map((p) => [p.userId, p]));

  // Filter users who have this notification type enabled
  const typeMap: Record<NotificationType, keyof NotificationPreference> = {
    TOURNAMENT_UPDATE: "tournamentUpdates",
    MATCH_RESULT: "matchResults",
    PREDICTION_SCORED: "predictionScored",
    ANNOUNCEMENT: "announcements",
    REGISTRATION_STATUS: "registrationStatus",
    CHECK_IN_REMINDER: "checkInReminder",
  };

  const prefKey = typeMap[params.type];
  const eligibleUserIds = userIds.filter((userId) => {
    const pref = prefMap.get(userId);
    if (!pref) return true; // No preference = all enabled
    return prefKey ? Boolean(pref[prefKey]) : true;
  });

  if (eligibleUserIds.length === 0) return [];

  // Batch-insert notifications in 1 query
  await prisma.notification.createMany({
    data: eligibleUserIds.map((userId) => ({
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: safeLink,
    })),
  });

  // Send emails to users with emailEnabled
  const emailEnabledUserIds = eligibleUserIds.filter((userId) => {
    const pref = prefMap.get(userId);
    return !pref || pref.emailEnabled;
  });

  // Fire-and-forget emails (don't block)
  Promise.all(
    emailEnabledUserIds.map((userId) =>
      sendEmailNotification(userId, params.title, params.message, safeLink)
    )
  ).catch(console.error);

  // Send push notifications to users with pushEnabled
  const pushEnabledUserIds = eligibleUserIds.filter((userId) => {
    const pref = prefMap.get(userId);
    return !pref || pref.pushEnabled;
  });

  sendBulkPushNotifications(pushEnabledUserIds, {
    title: params.title,
    message: params.message,
    link: safeLink,
    type: params.type,
  }).catch(console.error);

  return eligibleUserIds;
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.update({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
