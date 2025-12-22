import { Router } from 'express'
import { Conversation } from '../models/Conversation'

const router = Router()

// Send message endpoint
router.post('/send', async (req, res) => {
  try {
    const { body, userId, agentType, webhookUrl, threadId, subject } = req.body

    if (!userId || !agentType || !threadId) {
      return res.status(400).json({ ok: false, error: 'userId, agentType, and threadId are required' })
    }

    // 1. Find or Create Conversation by Thread ID
    let conversation = await Conversation.findOne({ threadId })
    if (!conversation) {
      conversation = new Conversation({
        userId,
        agentType,
        threadId,
        subject: subject || 'New Conversation',
        messages: []
      })
    }

    // 2. Add User Message
    conversation.messages.push({
      role: 'user',
      content: body,
      timestamp: new Date()
    })

    // 3. Send to n8n (Only current message + userId)
    const n8nUrl = webhookUrl || process.env.N8N_WEBHOOK_URL

    if (!n8nUrl) {
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

    console.log(`[DEBUG] Sending to n8n URL: ${n8nUrl} for User: ${userId}`)

    let response;
    try {
      response = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_message: body,
          userId,
        })
      })
    } catch (fetchError: any) {
      console.error('[ERROR] Failed to fetch from n8n:', fetchError)
      throw new Error(`Failed to connect to n8n: ${fetchError.message}`)
    }

    if (!response.ok) {
      // Fallback: If n8n errors, still save user message but maybe add error message as assistant?
      // For now, throw to let frontend handle 'error' state, but user message IS saved above? 
      // Actually, we haven't saved 'conversation' yet.
      // Let's NOT save the user message if n8n fails hard, so user can retry?
      // Or save it and say "Error"? 
      // Going with throw for now.
      const errorText = await response.text()
      console.error(`[ERROR] n8n returned ${response.status}: ${errorText}`)
      throw new Error(`n8n error ${response.status}: ${errorText}`)
    }

    let data;
    try {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn('[WARN] N8N response was not JSON:', text.substring(0, 100));
        data = { output: text };
      }
    } catch (readError: any) {
      console.error('[ERROR] Failed to read response text:', readError);
      throw new Error('Failed to read response from N8N');
    }

    const agentText = data.output || data.text || data.message || JSON.stringify(data)

    // 4. Save Agent Response
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

// Get history endpoint (Returns all threads for a user/agent)
router.get('/', async (req, res) => {
  try {
    const { userId, agentType } = req.query

    if (!userId || !agentType) {
      return res.status(400).json({ ok: false, error: 'userId and agentType are required' })
    }

    // Find ALL conversations for this user + agent
    const conversations = await Conversation.find({
      userId: userId as string,
      agentType: agentType as string
    }).sort({ updatedAt: -1 }) // Sort by newest first

    // Return array of conversation objects
    res.json({
      ok: true,
      conversations: conversations.map(c => ({
        threadId: c.threadId,
        subject: c.subject,
        messages: c.messages,
        updatedAt: c.updatedAt
      }))
    })
  } catch (error: any) {
    console.error('Error in GET /:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// Clear chat endpoint
router.delete('/clear', async (req, res) => {
  try {
    const { userId, agentType, threadId } = req.body

    if (!userId || !agentType) {
      return res.status(400).json({ ok: false, error: 'userId and agentType are required' })
    }

    if (threadId) {
      // Clear specific thread
      await Conversation.deleteOne({ userId, agentType, threadId })
    } else {
      // Clear ALL history for this agent
      await Conversation.deleteMany({ userId, agentType })
    }

    res.json({ ok: true, message: 'Chat cleared successfully' })
  } catch (error: any) {
    console.error('Error in DELETE /clear:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

export default router
