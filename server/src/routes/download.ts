import { Router } from 'express'
import { Conversation } from '../models/Conversation'

const router = Router()

router.get('/:sessionId/:agentId', async (req, res) => {
    try {
        const { sessionId, agentId } = req.params

        const conversation = await Conversation.findOne({ sessionId, agentId })

        if (!conversation) {
            return res.status(404).send('Conversation not found')
        }

        // Format the content
        let fileContent = `Chat History\nSession: ${sessionId}\nAgent: ${agentId}\nDate: ${new Date().toLocaleString()}\n\n-------------------\n\n`

        conversation.messages.forEach(msg => {
            const time = new Date(msg.timestamp).toLocaleTimeString()
            const role = msg.role === 'user' ? 'You' : 'Agent'
            fileContent += `[${time}] ${role}:\n${msg.content}\n\n`
        })

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="chat-${agentId}-${Date.now()}.txt"`)
        res.setHeader('Content-Type', 'text/plain')

        res.send(fileContent)

    } catch (error: any) {
        console.error('Error in download:', error)
        res.status(500).send('Error downloading file')
    }
})

export default router
