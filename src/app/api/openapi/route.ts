import { NextResponse } from "next/server";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SBLT CUP API",
    description: "Tournament management system for TFT (Teamfight Tactics)",
    version: "1.0.0",
  },
  servers: [
    { url: "/api", description: "API" },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        description: "Returns database connectivity and schema status",
        tags: ["System"],
        responses: {
          200: { description: "Healthy" },
          503: { description: "Unhealthy" },
        },
      },
    },
    "/tournaments": {
      get: {
        summary: "List tournaments",
        tags: ["Tournaments"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { 200: { description: "Paginated tournament list" } },
      },
    },
    "/tournaments/{id}": {
      get: {
        summary: "Get tournament details",
        tags: ["Tournaments"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Tournament details" } },
      },
    },
    "/tournaments/{id}/register": {
      post: {
        summary: "Register for tournament",
        tags: ["Tournaments"],
        security: [{ sessionAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          201: { description: "Registered" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/tournaments/{id}/predictions": {
      get: {
        summary: "Get predictions for tournament",
        tags: ["Predictions"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Predictions list" } },
      },
      post: {
        summary: "Submit prediction",
        tags: ["Predictions"],
        security: [{ sessionAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          201: { description: "Prediction submitted" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/predictions/leaderboard": {
      get: {
        summary: "Get prediction leaderboard",
        tags: ["Predictions"],
        responses: { 200: { description: "Leaderboard" } },
      },
    },
    "/leaderboard": {
      get: {
        summary: "Get player leaderboard",
        tags: ["Leaderboard"],
        responses: { 200: { description: "Leaderboard" } },
      },
    },
    "/announcements": {
      get: {
        summary: "List announcements",
        tags: ["Announcements"],
        responses: { 200: { description: "Announcements list" } },
      },
    },
    "/disputes": {
      get: {
        summary: "List disputes (authenticated)",
        tags: ["Disputes"],
        security: [{ sessionAuth: [] }],
        responses: {
          200: { description: "Disputes list" },
          401: { description: "Unauthorized" },
        },
      },
      post: {
        summary: "Create dispute",
        tags: ["Disputes"],
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tournamentId", "reason", "description"],
                properties: {
                  tournamentId: { type: "string" },
                  gameId: { type: "string" },
                  reason: { type: "string", enum: ["WRONG_RESULT", "BUG", "DISCONNECT", "CHEATING", "OTHER"] },
                  description: { type: "string", minLength: 10, maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Dispute created" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/notifications": {
      get: {
        summary: "Get user notifications",
        tags: ["Notifications"],
        security: [{ sessionAuth: [] }],
        responses: { 200: { description: "Notifications list" } },
      },
    },
    "/notifications/unread-count": {
      get: {
        summary: "Get unread notification count",
        tags: ["Notifications"],
        security: [{ sessionAuth: [] }],
        responses: { 200: { description: "Unread count" } },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register new user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name", "ign"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  name: { type: "string", minLength: 2 },
                  ign: { type: "string", minLength: 2 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered" },
          400: { description: "Validation error" },
        },
      },
    },
    "/players/profile": {
      get: {
        summary: "Get current player profile",
        tags: ["Players"],
        security: [{ sessionAuth: [] }],
        responses: { 200: { description: "Player profile" } },
      },
    },
    "/admin/users": {
      get: {
        summary: "List users (admin)",
        tags: ["Admin"],
        security: [{ sessionAuth: [] }],
        responses: {
          200: { description: "Users list" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/admin/audit-logs": {
      get: {
        summary: "Get audit logs (admin)",
        tags: ["Admin"],
        security: [{ sessionAuth: [] }],
        responses: {
          200: { description: "Audit logs" },
          403: { description: "Forbidden" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionAuth: {
        type: "apiKey",
        in: "cookie",
        name: "authjs.session-token",
        description: "NextAuth session cookie",
      },
    },
  },
  tags: [
    { name: "System", description: "Health and status endpoints" },
    { name: "Auth", description: "Authentication" },
    { name: "Tournaments", description: "Tournament management" },
    { name: "Predictions", description: "Prediction/forecasting" },
    { name: "Leaderboard", description: "Rankings" },
    { name: "Disputes", description: "Dispute resolution" },
    { name: "Notifications", description: "Push and in-app notifications" },
    { name: "Players", description: "Player profiles" },
    { name: "Admin", description: "Admin operations" },
    { name: "Announcements", description: "Announcements" },
  ],
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
