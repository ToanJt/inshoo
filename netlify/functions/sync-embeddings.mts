import { schedule } from "@netlify/functions";
import { syncNewEmbeddings } from "../../src/libs/sync-embeddings";

// Chạy mỗi ngày 3 giờ sáng — cron syntax giống Vercel
export const handler = schedule("0 3 * * *", async () => {
  try {
    const result = await syncNewEmbeddings();
    console.log("Sync OK:", result);
    return { statusCode: 200 };
  } catch (err) {
    console.error("Sync lỗi:", err);
    return { statusCode: 500 };
  }
});