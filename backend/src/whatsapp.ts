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
  total?: string
  /** First message: visit token text, used as the image caption (max 1024 chars). */
  caption: string
  /** Second message: itemised payment receipt (max 4096 chars). Older clients don't send it. */
  receipt?: string
}

interface Config {
  token: string
  phoneNumberId: string
  /**
   * Approved template for the token message. Expected shape:
   * IMAGE header, body params {{1}} name, {{2}} token, {{3}} services, {{4}} when, {{5}} payment.
   * Without it a free-form image message is sent, which Meta only delivers inside a 24h chat window.
   */
  template?: string
  /**
   * Approved template for the receipt message. Expected body params:
   * {{1}} name, {{2}} token, {{3}} total, {{4}} payment.
   * Without it the receipt goes out as free-form text (same 24h window rule).
   */
  receiptTemplate?: string
  templateLang: string
}

type Result = { ok: true; ids: string[] } | { ok: false; error: string }

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

const param = (v: string) => ({ type: 'text', text: v.slice(0, 200) })

const templateMessage = (cfg: Config, name: string, params: string[], mediaId: string | null = null) => ({
  type: 'template',
  template: {
    name,
    language: { code: cfg.templateLang },
    components: [
      ...(mediaId ? [{ type: 'header', parameters: [{ type: 'image', image: { id: mediaId } }] }] : []),
      { type: 'body', parameters: params.map(param) },
    ],
  },
})

async function send(cfg: Config, to: string, message: object) {
  const data = await graph(cfg, 'messages', JSON.stringify({ messaging_product: 'whatsapp', to, ...message }), true)
  return data.messages?.[0]?.id ?? ''
}

/** Sends the token (image + caption) and then the payment receipt, in that order. */
export async function sendBookingMessages(cfg: Config, n: BookingNotice, png: File | null): Promise<Result> {
  try {
    const mediaId = png ? await uploadImage(cfg, png) : null

    const token = cfg.template
      ? templateMessage(cfg, cfg.template, [n.name, n.token, n.services, n.when, n.payment], mediaId)
      : mediaId
        ? { type: 'image', image: { id: mediaId, caption: n.caption } }
        : { type: 'text', text: { body: n.caption } }

    const ids = [await send(cfg, n.to, token)]
    if (n.receipt) {
      const receipt = cfg.receiptTemplate
        ? templateMessage(cfg, cfg.receiptTemplate, [n.name, n.token, n.total ?? '', n.payment])
        : { type: 'text', text: { body: n.receipt } }
      ids.push(await send(cfg, n.to, receipt))
    }
    return { ok: true, ids }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'WhatsApp send failed' }
  }
}
