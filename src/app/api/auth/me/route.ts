import { getCurrentUser } from "@/lib/auth";
import { handleApiError, jsonData, jsonError } from "@/lib/api";
export async function GET() { try { const user = await getCurrentUser(); return user ? jsonData(user) : jsonError("Please log in to continue.", 401); } catch (error) { return handleApiError(error); } }
