import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { authErrorMessage, requestPasswordReset, signIn, signUp } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';

type Mode = 'signin' | 'signup' | 'forgot';

const TITLES: Record<Mode, string> = { signin: 'Sign in', signup: 'Create account', forgot: 'Reset password' };
const SUBMIT_LABELS: Record<Mode, string> = { signin: 'Sign in', signup: 'Sign up', forgot: 'Send reset link' };

const Login: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword('');
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    if (mode === 'signin') {
      const { error: authError } = await signIn(email, password);
      if (authError) setError(authErrorMessage(authError, 'Could not sign in. Please try again.'));
    } else if (mode === 'signup') {
      const { data, error: authError } = await signUp(email, password);
      if (authError) setError(authErrorMessage(authError, 'Could not sign up. Please try again.'));
      // With email confirmation on there is no session yet; without it AuthGate takes over.
      else if (!data.session) setNotice('Check your email to confirm your account.');
    } else {
      const { error: authError } = await requestPasswordReset(email);
      if (authError) setError(authErrorMessage(authError, 'Could not send the email. Please try again.'));
      // Same answer for unknown addresses, so the form does not reveal who has an account.
      else setNotice('If this email has an account, a reset link is on its way.');
    }
    setPending(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <CalendarDays className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-bold text-foreground">{TITLES[mode]}</h1>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="username" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {mode !== 'forgot' && (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{SUBMIT_LABELS[mode]}</Button>
        <div className="flex flex-col items-center">
          {mode === 'signin' && (
            <Button type="button" variant="link" size="sm" onClick={() => switchMode('forgot')}>Forgot password?</Button>
          )}
          {mode === 'signin' ? (
            <Button type="button" variant="link" size="sm" onClick={() => switchMode('signup')}>Create an account</Button>
          ) : (
            <Button type="button" variant="link" size="sm" onClick={() => switchMode('signin')}>Back to sign in</Button>
          )}
        </div>
      </form>
    </main>
  );
};

export default Login;
