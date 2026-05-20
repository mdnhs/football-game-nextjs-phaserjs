import NextAuth from 'next-auth';
import { authOptions } from '@/lib/admin-session';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
