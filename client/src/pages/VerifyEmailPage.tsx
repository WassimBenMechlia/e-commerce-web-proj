import { useQuery } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { PageTransition } from '@/components/common/PageTransition';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/axios';

export const VerifyEmailPage = () => {
  const { token = '' } = useParams();

  const verificationQuery = useQuery({
    queryKey: ['verify-email', token],
    queryFn: async () => {
      const { data } = await api.get<{ message: string }>(`/auth/verify-email/${token}`);
      return data.message;
    },
    enabled: Boolean(token),
  });

  return (
    <PageTransition>
      <section className="page-shell flex justify-center">
        <Card className="w-full max-w-xl grid gap-6 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
            <MailCheck className="h-8 w-8" />
          </div>
          <div className="space-y-3">
            <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
              Email verification
            </p>
            <h1 className="text-4xl">Account confirmation</h1>
            <p className="text-text-secondary">
              {verificationQuery.isLoading
                ? 'Verifying your email link...'
                : verificationQuery.data ??
                  'This verification link is invalid or expired.'}
            </p>
          </div>
          <div className="flex justify-center">
            <Link to="/login">
              <Button>Go to login</Button>
            </Link>
          </div>
        </Card>
      </section>
    </PageTransition>
  );
};
