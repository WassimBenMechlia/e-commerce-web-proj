import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

import { PageTransition } from '@/components/common/PageTransition';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';
import { resetPasswordFormSchema } from '@/validation/forms';
import type { ResetPasswordFormValues } from '@/validation/forms';

type ResetPasswordErrors = Partial<Record<keyof ResetPasswordFormValues, string>>;

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token = '' } = useParams();
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ResetPasswordErrors>({});

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const parsedForm = resetPasswordFormSchema.safeParse({
      token,
      password,
    });

    if (!parsedForm.success) {
      const fieldErrors = parsedForm.error.flatten().fieldErrors;
      setErrors({
        token: fieldErrors.token?.[0],
        password: fieldErrors.password?.[0],
      });
      toast.error(parsedForm.error.issues[0]?.message ?? 'Enter a valid new password.');
      setIsSubmitting(false);
      return;
    }

    setErrors({});

    try {
      await api.post('/auth/reset-password', {
        ...parsedForm.data,
      });
      toast.success('Password updated. Sign in with your new password.');
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
              New password
            </p>
            <h1 className="mt-2 text-4xl">Set your next password</h1>
          </div>
          <Input
            label="Password"
            type="password"
            value={password}
            error={errors.password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined, token: undefined }));
            }}
          />
          {errors.token ? <p className="text-sm text-brand-error">{errors.token}</p> : null}
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Update Password
          </Button>
        </Card>
      </section>
    </PageTransition>
  );
};
