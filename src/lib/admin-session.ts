import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compressPermissions, type PermissionValue } from '@/lib/permission/utils';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? '/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION ?? '/v1';

interface BackendEnvelope<T> {
  error: boolean;
  message: string;
  data: T;
}

interface BackendAdminLogin {
  token: string;
  admin: {
    id: string;
    email: string;
    role: string;
    permissions: PermissionValue[];
  };
}

function adminLoginUrl() {
  return `${BASE_URL}${API_PREFIX}${API_VERSION}/admin/auth/login`;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/admin-panel/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Admin credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;
        if (!email || !password) return null;

        const res = await fetch(adminLoginUrl(), {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const json = (await res.json().catch(() => null)) as BackendEnvelope<BackendAdminLogin> | null;
        if (!res.ok || !json || json.error) return null;

        return {
          id: json.data.admin.id,
          email: json.data.admin.email,
          name: json.data.admin.email,
          role: json.data.admin.role,
          accessToken: json.data.token,
          compressedPermissions: compressPermissions(json.data.admin.permissions),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.compressedPermissions = user.compressedPermissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = token.role;
        session.user.accessToken = token.accessToken;
        session.user.compressedPermissions = token.compressedPermissions;
      }
      return session;
    },
  },
};
