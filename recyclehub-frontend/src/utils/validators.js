import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerPersonalSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(60),
  gender: z.enum(['Male', 'Female'], { required_error: 'Please select gender' }),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  phoneNumber: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const materialSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  materialType: z.enum(['Metal', 'Textile', 'Electronics', 'Plastic', 'Paper', 'Glass', 'Other']),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().positive('Price must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  minOrderQty: z.coerce.number().positive('Minimum order quantity must be positive'),
  city: z.string().min(2, 'City is required'),
  address: z.string().min(5, 'Address is required'),
  grade: z.string().optional(),
  description: z.string().optional(),
});

/** Seller listing form: fixed price or SmartSwap (zero price). */
export const sellerMaterialFormSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(255),
    materialType: z.enum(['Metal', 'Textile', 'Electronics', 'Plastic', 'Paper', 'Glass', 'Other']),
    quantity: z.coerce.number().positive('Quantity must be positive'),
    unitPrice: z.coerce.number().min(0),
    unit: z.string().min(1, 'Unit is required'),
    minOrderQty: z.coerce.number().positive('Minimum order quantity must be positive'),
    city: z.string().min(2, 'City is required'),
    address: z.string().min(5, 'Address is required'),
    grade: z.string().optional(),
    description: z.string().optional(),
    isSmartSwap: z.boolean(),
    smartSwapDescription: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isSmartSwap) return;
    if (!data.unitPrice || data.unitPrice <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Price must be positive for fixed listings.', path: ['unitPrice'] });
    }
  });

export const buildOrderSchema = (allowZeroOffer) =>
  z.object({
    quantityOrdered: z.coerce.number().positive('Quantity must be positive'),
    offeredUnitPrice: allowZeroOffer
      ? z.coerce.number().min(0)
      : z.coerce.number().positive('Price must be positive'),
    buyerNote: z.string().optional(),
    shippingAddress: z.string().min(5, 'Shipping address is required'),
  });

export const orderSchema = buildOrderSchema(false);

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
});
