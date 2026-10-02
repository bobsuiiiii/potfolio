require('dotenv').config();
const { z } = require('zod');

const optUrl = z.string().url().optional().or(z.literal(''));

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be >= 32 chars'),
    JWT_EXPIRES_IN: z.string().default('2h'),
    CLIENT_ORIGIN: z.string().url(),
    LOG_LEVEL: z.string().default('info'),

    AI_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_TEXT_MODEL: z.string().default('gpt-4o-mini'),
    IMAGE_PROVIDER: z.enum(['none', 'openai']).default('none'),
    OPENAI_IMAGE_MODEL: z.string().default('dall-e-3'),

    EMAIL_PROVIDER: z.enum(['resend', 'smtp']).default('resend'),
    CONTACT_TO: z.string().email().optional().or(z.literal('')),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM: z.string().default('onboarding@resend.dev'),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),

    TAMPER_BEACON_ENABLED: z.enum(['true', 'false']).default('false'),
    TAMPER_BEACON_URL: optUrl,
  })
  .superRefine((v, ctx) => {
    if (v.AI_PROVIDER === 'gemini' && !v.GEMINI_API_KEY)
      ctx.addIssue({ code: 'custom', path: ['GEMINI_API_KEY'], message: 'required when AI_PROVIDER=gemini' });
    if ((v.AI_PROVIDER === 'openai' || v.IMAGE_PROVIDER === 'openai') && !v.OPENAI_API_KEY)
      ctx.addIssue({ code: 'custom', path: ['OPENAI_API_KEY'], message: 'required when using OpenAI for text or images' });
  });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}
module.exports = parsed.data;
