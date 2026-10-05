import { ensureInitialAdmin, createSession, verifyPassword } from "@/lib/auth";
import { getCollections } from "@/lib/database";
import { handleApiError, jsonData, jsonError } from "@/lib/api";
import { credentialsSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = credentialsSchema.parse(await request.json());
    await ensureInitialAdmin();
    const { users } = await getCollections();
    const user = await users.findOne({ email: input.email });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) return jsonError("Incorrect email or password.", 401);
    return jsonData(await createSession(user));
  } catch (error) { return handleApiError(error); }
}
