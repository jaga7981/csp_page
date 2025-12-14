import { Router } from 'express'
import { Conversation } from '../models/Conversation'

const router = Router()

// Send message endpoint
router.post('/send', async (req, res) => {
  try {
    const { body, sessionId, agentId, webhookUrl } = req.body

    if (!sessionId || !agentId) {
      return res.status(400).json({ ok: false, error: 'sessionId and agentId are required' })
    }

    // 1. Find or Create Conversation
    let conversation = await Conversation.findOne({ sessionId, agentId })
    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        agentId,
        messages: []
      })
    }

    // --- LIMIT CHECK ---
    // Limit is 10 sets. 1 Set = 2 messages (User + Assistant). Total 20 messages.
    if (conversation.messages.length >= 20) {
      return res.status(403).json({
        ok: false,
        error: 'Session Limit Reached',
        code: 'LIMIT_REACHED',
        messageCount: conversation.messages.length
      })
    }

    // 2. Add User Message
    conversation.messages.push({
      role: 'user',
      content: body,
      timestamp: new Date()
    })

    // Save immediately to persist user message
    await conversation.save()

    // 3. Prepare History for n8n (Last 10 messages EXCLUDING the current one)
    // Format as a string for LLM context
    const historyArray = conversation.messages.slice(0, -1).slice(-10)
    const conversation_history = historyArray.map(m => {
      const role = m.role === 'user' ? 'User' : 'Agent'
      return `${role}: ${m.content}`
    }).join('\n')

    console.log(`[DEBUG] Session: ${sessionId}, History Length: ${historyArray.length}`)

    // 4. Send to n8n
    // Use the webhookUrl passed from client (specific to agent) OR fallback to env
    const n8nUrl = webhookUrl || process.env.N8N_WEBHOOK_URL

    if (!n8nUrl) {
      // If no URL, just echo back for testing
      console.warn('N8N_WEBHOOK_URL not configured, echoing back')
      const echoResponse = `Echo: ${body}`
      conversation.messages.push({
        role: 'assistant',
        content: echoResponse,
        timestamp: new Date()
      })
      await conversation.save()
      return res.json({
        ok: true,
        response: echoResponse,
        messageCount: conversation.messages.length
      })
    }

    console.log(`[DEBUG] Sending to n8n URL: ${n8nUrl}`)

    let response;
    try {
      response = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_message: body,
          sessionId,
          agentId,
          conversation_history
        })
      })
    } catch (fetchError: any) {
      console.error('[ERROR] Failed to fetch from n8n:', fetchError)
      throw new Error(`Failed to connect to n8n: ${fetchError.message}`)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[ERROR] n8n returned ${response.status}: ${errorText}`)
      throw new Error(`n8n error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const agentText = data.output || data.text || data.message || JSON.stringify(data)

    // 5. Save Agent Response
    conversation.messages.push({
      role: 'assistant',
      content: agentText,
      timestamp: new Date()
    })
    await conversation.save()

    res.json({
      ok: true,
      response: agentText,
      messageCount: conversation.messages.length
    })
  } catch (error: any) {
    console.error('Error in /send:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// Get history endpoint
router.get('/', async (req, res) => {
  try {
    const { sessionId, agentId } = req.query

    if (!sessionId || !agentId) {
      return res.status(400).json({ ok: false, error: 'sessionId and agentId are required' })
    }

    const conversation = await Conversation.findOne({
      sessionId: sessionId as string,
      agentId: agentId as string
    })

    // Return messages or empty array if no conversation yet
    res.json({ ok: true, conversations: conversation ? conversation.messages : [] })
  } catch (error: any) {
    console.error('Error in GET /:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

export default router
