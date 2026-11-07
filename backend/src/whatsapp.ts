/** WhatsApp Cloud API (Meta) client for booking confirmations. */

const GRAPH = 'https://graph.facebook.com/v21.0'

export interface BookingNotice {
  /** Full number with country code, digits only. */
  to: string
  token: string
  name: string
  services: string
  when: string
  payment: string
  /** Plain-text receipt, used as the image caption (max 1024 chars). */
  caption: string
}

interface Config {
  token: string
  phoneNumberId: string
  /**
   * Approved template for business-initiated messages. Expected shape:
   * IMAGE header, body params {{1}} name, {{2}} token, {{3}} services, {{4}} when, {{5}} payment.
   * Without it a free-form image message is sent, which Meta only delivers inside a 24h chat window.
   */
  template?: string
  templateLang: string
}

type Result = { ok: true; id: string } | { ok: false; error: string }

async function graph(cfg: Config, path: string, body: BodyInit, json: boolean) {
  const res = await fetch(`${GRAPH}/${cfg.phoneNumberId}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, ...(json && { 'Content-Type': 'application/json' }) },
    body,
  })
  const data = (await res.json().catch(() => ({}))) as { id?: string; messages?: { id: string }[]; error?: { message?: string } }
  if (!res.ok) throw new Error(data.error?.message ?? `WhatsApp API ${res.status}`)
  return data
}

async function uploadImage(cfg: Config, png: File) {
  const form = new FormData()
  form.append('messaging_product', 'whatsapp')
  form.append('type', 'image/png')
  form.append('file', png, png.name || 'token.png')
  const data = await graph(cfg, 'media', form, false)
  if (!data.id) throw new Error('Media upload returned no id')
  return data.id
}

export async function sendBookingMessage(cfg: Config, n: BookingNotice, png: File | null): Promise<Result> {
  try {
    const mediaId = png ? await uploadImage(cfg, png) : null
    const text = (v: string) => ({ type: 'text', text: v.slice(0, 200) })

    const message = cfg.template
      ? {
          type: 'template',
          template: {
            name: cfg.template,
            language: { code: cfg.templateLang },
            components: [
              ...(mediaId ? [{ type: 'header', parameters: [{ type: 'image', image: { id: mediaId } }] }] : []),
              { type: 'body', parameters: [n.name, n.token, n.services, n.when, n.payment].map(text) },
            ],
          },
        }
      : mediaId
        ? { type: 'image', image: { id: mediaId, caption: n.caption } }
        : { type: 'text', text: { body: n.caption } }

    const data = await graph(cfg, 'messages', JSON.stringify({ messaging_product: 'whatsapp', to: n.to, ...message }), true)
    return { ok: true, id: data.messages?.[0]?.id ?? '' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'WhatsApp send failed' }
  }
}
