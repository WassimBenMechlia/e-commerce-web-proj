import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import { PageTransition } from '@/components/common/PageTransition';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await api.post('/auth/register', {
        name,
        email,
        password,
      });
      toast.success('Account created. Verify your email to continue.');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <section className="page-shell flex justify-center">
        <Card className="w-full max-w-lg grid gap-6 p-8">
          <div>
            <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
              Create account
            </p>
            <h1 className="mt-2 text-4xl">Join Desert Modern</h1>
          </div>
          <div className="grid gap-4">
            <Input value={name} onChange={(event) => setName(event.target.value)} label="Name" />
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              label="Email"
              type="email"
            />
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              label="Password"
              type="password"
            />
          </div>
          <div className="text-sm text-text-secondary">
            Already registered?{' '}
            <Link to="/login" className="text-brand-primary">
              Sign in
            </Link>
          </div>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Create Account
          </Button>
        </Card>
      </section>
    </PageTransition>
  );
};
