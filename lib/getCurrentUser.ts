import { cookies } from 'next/headers';
import { verifyToken } from './auth';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  const user = verifyToken(token);
  return user;
}
