import { Schema, model, Document } from 'mongoose';

interface IMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface IConversation extends Document {
    userId: string;
    agentType: string;
    threadId: string;    // New: Unique ID for the thread
    subject: string;     // New: Subject of the thread
    createdAt: Date;
    updatedAt: Date;
    messages: IMessage[];
    metadata?: Record<string, any>;
}

const messageSchema = new Schema<IMessage>({
    role: { type: String, required: true, enum: ['user', 'assistant'] },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const conversationSchema = new Schema<IConversation>({
    userId: { type: String, required: true, index: true },
    agentType: { type: String, required: true, index: true },
    threadId: { type: String, required: true, unique: true }, // Unique per thread
    subject: { type: String, required: false, default: 'New Conversation' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    messages: [messageSchema],
    metadata: { type: Map, of: Schema.Types.Mixed }
});

// Update the 'updatedAt' field on save
conversationSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Index for efficient querying by user and agent (not unique anymore, many threads allowed)
conversationSchema.index({ userId: 1, agentType: 1 });

export const Conversation = model<IConversation>('Conversation', conversationSchema);
