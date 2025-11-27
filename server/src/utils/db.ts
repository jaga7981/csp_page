import mongoose from 'mongoose'

export async function connectToDb() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agents_page'
  await mongoose.connect(uri)
  console.log('Connected to MongoDB')
}
