import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sendBookingMessages, type BookingNotice } from './whatsapp'

type Bindings = Env & {
  SUPABASE_SECRET_KEY?: string
  WHATSAPP_TOKEN?: string
  WHATSAPP_PHONE_NUMBER_ID?: string
  WHATSAPP_TEMPLATE?: string
  WHATSAPP_RECEIPT_TEMPLATE?: string
  WHATSAPP_TEMPLATE_LANG?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', (c, next) =>
  cors({
    origin: c.env.ALLOWED_ORIGINS.split(','),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })(c, next),
)

app.get('/health', (c) => c.json({ ok: true, service: 'beaudesk-api', time: new Date().toISOString() }))

/** Sends two WhatsApp messages right after payment: the visit token image, then the payment receipt. */
app.post('/notify/booking', async (c) => {
  const form = await c.req.formData().catch(() => null)
  if (!form) return c.json({ error: 'Expected multipart form data' }, 400)

  let notice: BookingNotice
  try {
    notice = JSON.parse(String(form.get('payload') ?? ''))
  } catch {
    return c.json({ error: 'Invalid payload' }, 400)
  }
  if (!/^\d{8,15}$/.test(notice.to ?? '')) return c.json({ error: 'Invalid WhatsApp number' }, 400)
  if (!/^[A-Z]{1,3}-\d{3,}$/.test(notice.token ?? '')) return c.json({ error: 'Invalid token' }, 400)
  if (typeof notice.caption !== 'string' || notice.caption.length > 1024) return c.json({ error: 'Invalid token message' }, 400)
  if (notice.receipt !== undefined && (typeof notice.receipt !== 'string' || notice.receipt.length > 4096))
    return c.json({ error: 'Invalid receipt' }, 400)

  const image = form.get('image')
  const png = image instanceof File && image.type === 'image/png' && image.size < 2_000_000 ? image : null

  const { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = c.env
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) return c.json({ status: 'demo' })

  const result = await sendBookingMessages(
    {
      token: WHATSAPP_TOKEN,
      phoneNumberId: WHATSAPP_PHONE_NUMBER_ID,
      template: c.env.WHATSAPP_TEMPLATE,
      receiptTemplate: c.env.WHATSAPP_RECEIPT_TEMPLATE,
      templateLang: c.env.WHATSAPP_TEMPLATE_LANG ?? 'en',
    },
    notice,
    png,
  )
  return result.ok ? c.json({ status: 'sent', ids: result.ids }) : c.json({ status: 'failed', error: result.error }, 502)
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
