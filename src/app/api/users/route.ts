import { getCollections } from "@/lib/database";
import {
  handleApiError,
  jsonData,
  serializeUser,
} from "@/lib/api";
import { createUserSchema } from "@/lib/validation";
import { requireAdmin, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
    const { users } = await getCollections();
    const documents = await users.find().sort({ createdAt: -1 }).limit(200).toArray();
    return jsonData(documents.map(serializeUser));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const input = createUserSchema.parse(body);
    const { users } = await getCollections();
    const now = new Date();
    const document = { ...input, createdAt: now, updatedAt: now };
    const result = await users.insertOne(document);

    return jsonData(serializeUser({ ...document, _id: result.insertedId }), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
