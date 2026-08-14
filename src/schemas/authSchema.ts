import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Nama lengkap minimal 2 karakter')
      .max(150, 'Nama lengkap maksimal 150 karakter')
      .trim(),
    email: z
      .string()
      .email('Format email tidak valid')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(6, 'Kata sandi minimal 6 karakter'),
    confirmPassword: z
      .string()
      .min(6, 'Konfirmasi kata sandi minimal 6 karakter'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok dengan kata sandi',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .email('Format email tidak valid')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi'),
});

export const updateProfileSchema = z.object({
  nickname: z.string().max(50, 'Nama panggilan maksimal 50 karakter').optional(),
  gender: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
  avatarUrl: z.string().url('URL Avatar tidak valid').optional(),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
