import { createSession, hashPassword } from "@/lib/auth";
import { getCollections } from "@/lib/database";
import { handleApiError, jsonData } from "@/lib/api";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const { users } = await getCollections();
    const now = new Date();
    const document = { name: input.name, email: input.email, role: "student" as const, passwordHash: await hashPassword(input.password), createdAt: now, updatedAt: now };
    const result = await users.insertOne(document);
    return jsonData(await createSession({ ...document, _id: result.insertedId }), 201);
  } catch (error) { return handleApiError(error); }
}
