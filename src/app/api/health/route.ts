import { getDatabase } from "@/lib/mongodb";
import { handleApiError, jsonData } from "@/lib/api";

export async function GET() {
  try {
    const database = await getDatabase();
    await database.command({ ping: 1 });
    return jsonData({ status: "healthy", database: "connected" });
  } catch (error) {
    return handleApiError(error);
  }
}
