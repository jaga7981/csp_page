import express from 'express'
import cors from 'cors'
import messagesRouter from './routes/messages'
import downloadRouter from './routes/download'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/messages', messagesRouter)
app.use('/api/download', downloadRouter)

app.get('/health', (req, res) => res.json({ ok: true }))

export default app
