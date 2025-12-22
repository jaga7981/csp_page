import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import app from './app'
import authRoutes from './routes/auth'
import { connectToDb } from './utils/db'

const PORT = process.env.PORT || 4000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)

async function start() {
  // Start listening first so frontend doesn't get "failed to fetch"
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)

    // Then try to connect to DB
    connectToDb().catch(err => {
      console.error('CRITICAL: Failed to connect to MongoDB. Auth features will not work.')
      console.error('Ensure MongoDB is running locally or check your MONGO_URI.')
      console.dir(err)
    })
  })
}

start()
