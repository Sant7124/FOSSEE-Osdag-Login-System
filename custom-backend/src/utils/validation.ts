import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must be at most 100 characters long'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    // We lowercase for application-level normalization, but rely on citext in DB for absolute protection
    .transform((val) => val.toLowerCase()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must be at most 100 characters long')
    // A reasonable strength requirement: at least one letter and one number
    .regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, 'Password must contain at least one letter and one number'),
}).strict(); // strict() ensures no extra malicious fields are accepted

export type RegisterInput = z.infer<typeof registerSchema>;
