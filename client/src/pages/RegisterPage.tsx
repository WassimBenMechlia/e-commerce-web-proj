import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import { PageTransition } from '@/components/common/PageTransition';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';
import { registerFormSchema } from '@/validation/forms';
import type { RegisterFormValues } from '@/validation/forms';

type RegisterErrors = Partial<Record<keyof RegisterFormValues, string>>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const parsedForm = registerFormSchema.safeParse({
      name,
      email,
      password,
    });

    if (!parsedForm.success) {
      const fieldErrors = parsedForm.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      toast.error(parsedForm.error.issues[0]?.message ?? 'Enter valid account details.');
      setIsSubmitting(false);
      return;
    }

    setErrors({});

    try {
      const { data } = await api.post<{ message: string }>('/auth/register', {
        ...parsedForm.data,
      });
      toast.success(data.message);
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
            <Input
              value={name}
              error={errors.name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
              label="Name"
            />
            <Input
              value={email}
              error={errors.email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              label="Email"
              type="email"
            />
            <Input
              value={password}
              error={errors.password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
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
