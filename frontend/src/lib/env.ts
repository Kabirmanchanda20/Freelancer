import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url('VITE_API_BASE_URL must be a valid URL'),
  VITE_ALLOWED_EMAIL_DOMAIN: z.string().min(1).default('thapar.edu'),
})

export type AppEnv = {
  apiBaseUrl: string
  allowedEmailDomain: string
}

function parseEnv(): { env: AppEnv | null; error: string | null } {
  const result = envSchema.safeParse({
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_ALLOWED_EMAIL_DOMAIN: import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? 'thapar.edu',
  })

  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join('; ')
    return {
      env: null,
      error: `Missing or invalid environment configuration: ${message}. Copy frontend/.env.example to frontend/.env and set VITE_API_BASE_URL (e.g. http://localhost:5000).`,
    }
  }

  return {
    env: {
      apiBaseUrl: result.data.VITE_API_BASE_URL.replace(/\/$/, ''),
      allowedEmailDomain: result.data.VITE_ALLOWED_EMAIL_DOMAIN,
    },
    error: null,
  }
}

const parsed = parseEnv()
export const env = parsed.env
export const envError = parsed.error
