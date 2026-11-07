import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = Env & { SUPABASE_SECRET_KEY?: string }

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', (c, next) =>
  cors({
    origin: c.env.ALLOWED_ORIGINS.split(','),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })(c, next),
)

app.get('/health', (c) => c.json({ ok: true, service: 'beaudesk-api', time: new Date().toISOString() }))

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
