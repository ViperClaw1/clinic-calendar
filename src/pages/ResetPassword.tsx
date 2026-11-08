import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authErrorMessage, updatePassword, useSession } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';

/** Landing page of the email link: supabase-js turns the link's token into a session on load. */
const ResetPassword: React.FC = () => {
  const session = useSession();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error: authError } = await updatePassword(password);
    setPending(false);
    if (authError) setError(authErrorMessage(authError, 'Could not update the password. Please try again.'));
    else navigate('/', { replace: true });
  };

  if (session === undefined) return null;

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
        <p className="text-foreground">This reset link is invalid or has expired. Please request a new one.</p>
        <Button variant="outline" asChild><Link to="/">Back to sign in</Link></Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-bold text-foreground">Set a new password</h1>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <PasswordInput id="new-password" autoComplete="new-password" placeholder="Enter a new password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>Update password</Button>
      </form>
    </main>
  );
};

export default ResetPassword;
