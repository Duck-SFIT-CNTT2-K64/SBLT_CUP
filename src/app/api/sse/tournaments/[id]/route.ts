import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { sseManager } from "@/lib/sse";
import { randomUUID } from "crypto";
import { resolveTournamentId } from "@/lib/tournament-resolve";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: slugOrId } = await params;
  const tournamentId = await resolveTournamentId(slugOrId);
  if (!tournamentId) {
    return new Response("Not found", { status: 404 });
  }
  const clientId = randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      sseManager.addClient(clientId, controller, {
        userId: session.user.id,
        tournamentId,
      });

      const message = `event: connected\ndata: ${JSON.stringify({ clientId, tournamentId })}\n\n`;
      controller.enqueue(new TextEncoder().encode(message));

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: heartbeat\n\n`));
        } catch {
          cleanup();
        }
      }, 30000);

      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        clearInterval(heartbeat);
        sseManager.removeClient(clientId);
        try { controller.close(); } catch {}
      };

      request.signal.addEventListener("abort", cleanup, { once: true });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
