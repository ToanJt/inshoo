// app/api/sync-embeddings/route.ts
import { syncNewEmbeddings } from "@/libs/sync-embeddings";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const secret = req.headers.get("x-sync-secret");
  if (secret !== process.env.SYNC_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Fire-and-forget — không block response, Medusa không cần chờ
  syncNewEmbeddings().catch(console.error);

  return new Response("ok");
}
