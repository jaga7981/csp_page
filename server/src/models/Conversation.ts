import { Schema, model, Document } from 'mongoose';

interface IMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface IConversation extends Document {
    sessionId: string;
    agentId: string;
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
    sessionId: { type: String, required: true, index: true },
    agentId: { type: String, required: true, index: true },
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

export const Conversation = model<IConversation>('Conversation', conversationSchema);
