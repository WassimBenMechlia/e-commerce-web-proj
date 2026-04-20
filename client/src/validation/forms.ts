import { z } from 'zod';

const requiredText = (label: string, minLength: number) =>
  z
    .string()
    .trim()
    .min(
      minLength,
      minLength === 1
        ? `${label} is required.`
        : `${label} must be at least ${minLength} characters.`,
    );

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine(
      (value) =>
        !value || value.length === 0 || z.string().url().safeParse(value).success,
      `${label} must be a valid URL.`,
    )
    .transform((value) => (value && value.length > 0 ? value : undefined));

const requiredPositiveNumberText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) > 0,
      `${label} must be greater than 0.`,
    );

const optionalPositiveNumberText = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine(
      (value) =>
        !value || value.length === 0 || (Number.isFinite(Number(value)) && Number(value) > 0),
      `${label} must be greater than 0.`,
    )
    .transform((value) => (value && value.length > 0 ? value : undefined));

const requiredWholeNumberText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 0,
      `${label} must be a whole number 0 or greater.`,
    );

export const addressFormSchema = z.object({
  label: requiredText('Address label', 1),
  fullName: requiredText('Full name', 2),
  line1: requiredText('Address line 1', 3),
  line2: optionalText,
  city: requiredText('City', 2),
  state: requiredText('State', 2),
  postalCode: requiredText('Postal code', 2),
  country: requiredText('Country', 2),
  phone: requiredText('Phone', 6),
  isDefault: z.boolean().optional(),
});

export const registerFormSchema = z.object({
  name: requiredText('Name', 2),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const loginFormSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const forgotPasswordFormSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});

export const resetPasswordFormSchema = z.object({
  token: z.string().trim().min(10, 'Reset token is missing or invalid.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const profileFormSchema = z.object({
  name: requiredText('Name', 2),
  avatarUrl: optionalUrl('Avatar URL'),
});

export const reviewFormSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: requiredText('Review', 4),
});

export const productDraftSchema = z
  .object({
    name: requiredText('Product name', 2),
    description: requiredText('Description', 20),
    price: requiredPositiveNumberText('Price'),
    compareAtPrice: optionalPositiveNumberText('Compare-at price'),
    category: requiredText('Category', 1),
    stock: requiredWholeNumberText('Stock'),
    sku: requiredText('SKU', 2),
    tags: optionalText,
    ecoBadge: optionalText,
    isActive: z.boolean(),
    imageUrl: optionalUrl('Image URL'),
    imageAlt: optionalText,
  })
  .superRefine((value, context) => {
    if (value.compareAtPrice && Number(value.compareAtPrice) <= Number(value.price)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['compareAtPrice'],
        message: 'Compare-at price must be greater than the current price.',
      });
    }
  });

export type AddressFormValues = z.input<typeof addressFormSchema>;
export type RegisterFormValues = z.input<typeof registerFormSchema>;
export type LoginFormValues = z.input<typeof loginFormSchema>;
export type ForgotPasswordFormValues = z.input<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.input<typeof resetPasswordFormSchema>;
export type ProfileFormValues = z.input<typeof profileFormSchema>;
export type ReviewFormValues = z.input<typeof reviewFormSchema>;
export type ProductDraftFormValues = z.input<typeof productDraftSchema>;
