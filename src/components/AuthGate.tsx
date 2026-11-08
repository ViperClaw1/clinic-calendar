import React from 'react';
import { signOut, useMembership, useSession } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import Login from '@/pages/Login';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = useSession();
  const membership = useMembership(session?.user.id);

  if (session === undefined) return null;
  if (!session) return <Login />;
  if (membership.isPending) return null;

  if (!membership.data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
        <p className="text-foreground">
          {membership.isError
            ? 'Could not check your access. Please reload the page.'
            : `${session.user.email} has no access to this clinic. Ask an administrator to add you.`}
        </p>
        <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
      </main>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
