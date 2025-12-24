import express from 'express'
import cors from 'cors'
import messagesRouter from './routes/messages'
import downloadRouter from './routes/download'
import authRoutes from './routes/auth'

const app = express()
app.use(cors())
app.use(express.json())


// Mount on both paths to handle Vercel's behavior (sometimes strips /api, sometimes keeps it)
app.use('/auth', authRoutes)
app.use('/api/auth', authRoutes)
app.use('/messages', messagesRouter)
app.use('/api/messages', messagesRouter)
app.use('/download', downloadRouter)
app.use('/api/download', downloadRouter)

app.get('/health', (req, res) => res.json({ ok: true }))

// DEBUG: Catch-all to see what path Express is actually receiving on Vercel
app.use('*', (req, res) => {
    console.log(`[DEBUG] 404 Hit: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: 'Route not found (Debug)',
        path: req.path,
        url: req.url,
        originalUrl: req.originalUrl,
        method: req.method,
        availableRoutes: ['/api/auth', '/api/messages', '/api/download']
    });
});

export default app
