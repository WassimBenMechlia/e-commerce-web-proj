import { useState } from 'react';
import toast from 'react-hot-toast';

import { PageTransition } from '@/components/common/PageTransition';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';
import { forgotPasswordFormSchema } from '@/validation/forms';
import type { ForgotPasswordFormValues } from '@/validation/forms';

type ForgotPasswordErrors = Partial<Record<keyof ForgotPasswordFormValues, string>>;

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const parsedForm = forgotPasswordFormSchema.safeParse({ email });

    if (!parsedForm.success) {
      const fieldErrors = parsedForm.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
      });
      toast.error(parsedForm.error.issues[0]?.message ?? 'Enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    setErrors({});

    try {
      const { data } = await api.post<{ message: string }>('/auth/forgot-password', {
        ...parsedForm.data,
      });
      toast.success(data.message);
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
              Password reset
            </p>
            <h1 className="mt-2 text-4xl">Request a reset link</h1>
          </div>
          <Input
            label="Email"
            type="email"
            value={email}
            error={errors.email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
            }}
          />
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Send Reset Email
          </Button>
        </Card>
      </section>
    </PageTransition>
  );
};
