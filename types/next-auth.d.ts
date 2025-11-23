import 'next-auth';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
      licenseAccepted?: boolean;
      banned?: boolean;
    };
  }

  interface User {
    role?: UserRole;
    licenseAccepted?: boolean;
    banned?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}













