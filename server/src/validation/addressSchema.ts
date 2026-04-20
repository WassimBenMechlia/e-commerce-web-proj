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

export const shippingAddressSchema = z.object({
  label: requiredText('Address label', 1),
  fullName: requiredText('Full name', 2),
  line1: requiredText('Address line 1', 3),
  line2: optionalText,
  city: requiredText('City', 2),
  state: requiredText('State', 2),
  postalCode: requiredText('Postal code', 2),
  country: requiredText('Country', 2),
  phone: requiredText('Phone', 6),
});

export const addressSchema = shippingAddressSchema.extend({
  isDefault: z.boolean().optional(),
});
