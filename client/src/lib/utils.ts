import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { OrderStatus, PaymentStatus } from '@/types';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

export const getStatusClasses = (status: OrderStatus | PaymentStatus) => {
  if (status === 'delivered' || status === 'paid') {
    return 'bg-brand-accent/15 text-brand-accent';
  }

  if (status === 'processing' || status === 'pending') {
    return 'bg-brand-warning/15 text-brand-warning';
  }

  if (status === 'shipped') {
    return 'bg-brand-primary/15 text-brand-primary';
  }

  return 'bg-brand-error/15 text-brand-error';
};

export const getErrorMessage = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
};
