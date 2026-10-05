import { destroySession } from "@/lib/auth";
import { handleApiError, jsonData } from "@/lib/api";
export async function POST() { try { await destroySession(); return jsonData({ loggedOut: true }); } catch (error) { return handleApiError(error); } }
