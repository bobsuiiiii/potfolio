const { z } = require('zod');
const env = require('../config/env');
const logger = require('../config/logger');

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  message: z.string().trim().min(10).max(3000),
  website: z.string().max(0).optional(), // honeypot: real users leave this empty
});

async function sendViaResend({ name, email, message }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: `Portfolio <${env.RESEND_FROM}>`,
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `Portfolio message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function sendViaSmtp({ name, email, message }) {
  const nodemailer = require('nodemailer');
  const tx = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 10_000,
  });
  await tx.sendMail({
    from: env.SMTP_USER,
    to: env.CONTACT_TO,
    replyTo: email,
    subject: `Portfolio message from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });
}

exports.send = async (req, res, next) => {
  try {
    // Honeypot filled: pretend success so bots learn nothing.
    if (req.body && typeof req.body.website === 'string' && req.body.website.length > 0) return res.json({ ok: true });

    const p = schema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: 'Please fill in every field correctly.' });

    const configured =
      env.CONTACT_TO &&
      (env.EMAIL_PROVIDER === 'resend' ? env.RESEND_API_KEY : env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
    if (!configured) {
      logger.error({ event: 'contact_not_configured' });
      return res.status(503).json({ error: 'Contact form is not configured yet.' });
    }
    await (env.EMAIL_PROVIDER === 'resend' ? sendViaResend : sendViaSmtp)(p.data);
    logger.info({ event: 'contact_sent' });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ event: 'contact_failed', msg: err.message });
    next(Object.assign(new Error('Could not send your message. Try again later.'), { status: 502 }));
  }
};
