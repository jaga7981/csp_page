import mongoose from 'mongoose'

export async function connectToDb() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agents_page'
  try {
    console.log(`Attempting to connect to MongoDB at ${uri}...`)
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Fail after 5 seconds instead of 30
    })
    console.log('✅ Connected to MongoDB successfully')
  } catch (error: any) {
    console.error('❌ MongoDB Connection Error!')
    console.error('--------------------------------------------------')
    console.error(`Could not connect to: ${uri}`)
    console.error('Reason:', error.message)
    console.error('')
    console.error('TO FIX THIS:')
    console.error('1. Make sure MongoDB is installed on your machine.')
    console.error('2. Ensure the MongoDB service is running (e.g., run "mongod").')
    console.error('3. Check your MONGO_URI in .env if you are using a custom one.')
    console.error('--------------------------------------------------')
    throw error // Re-throw so index.ts can handle it
  }
}
