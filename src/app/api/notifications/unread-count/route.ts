import { auth } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await getUnreadCount(session.user.id);
  return Response.json({ count });
}
