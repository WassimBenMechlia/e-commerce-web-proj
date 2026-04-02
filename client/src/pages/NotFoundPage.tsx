import { Link } from 'react-router-dom';

import { PageTransition } from '@/components/common/PageTransition';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const NotFoundPage = () => (
  <PageTransition>
    <section className="page-shell flex justify-center">
      <Card className="w-full max-w-2xl grid gap-6 p-8 text-center">
        <p className="font-serif text-sm uppercase tracking-[0.3em] text-text-secondary">
          404
        </p>
        <h1 className="text-5xl">Page not found</h1>
        <p className="text-text-secondary">
          The route you requested does not exist in the storefront.
        </p>
        <div className="flex justify-center">
          <Link to="/">
            <Button>Return home</Button>
          </Link>
        </div>
      </Card>
    </section>
  </PageTransition>
);
