import dotenv from 'dotenv'
dotenv.config()

import app from './app'
import { connectToDb } from './utils/db'

const PORT = process.env.PORT || 4000

async function start() {
  try {
    await connectToDb()
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server', err)
    process.exit(1)
  }
}

start()
