import { Router } from 'express'

const router = Router()

// Placeholder endpoints. Port original webhook logic here.
router.post('/send', async (req, res) => {
  // Expect body: { sessionId, agent, subject, body }
  console.log('POST /api/messages/send', req.body)
  // TODO: persist to DB and proxy to agent webhook
  res.json({ ok: true, note: 'send endpoint placeholder' })
})

router.get('/', async (req, res) => {
  // list conversations
  res.json({ ok: true, conversations: [] })
})

export default router
