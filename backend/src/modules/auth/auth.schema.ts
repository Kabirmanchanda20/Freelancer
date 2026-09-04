import { z } from 'zod'
import { env } from '../../config/env.js'

export const signupSchema = z.object({
  email: z.email().refine((e) => e.toLowerCase().endsWith(`@${env.ALLOWED_EMAIL_DOMAIN}`), {
    message: `Email must end with @${env.ALLOWED_EMAIL_DOMAIN}`,
  }),
  password: z.string().min(8),
  full_name: z.string().min(2),
  campus_role: z.enum(['ug_student', 'mtech', 'phd', 'faculty', 'staff', 'department']),
  department_id: z.string().uuid().optional(),
  roll_or_employee_id: z.string().optional(),
  program: z.string().optional(),
  year_of_study: z.number().int().min(1).max(6).optional(),
  designation: z.string().optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})
