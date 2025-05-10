import { connectToDatabase } from '@/lib/mongodb';

interface Message {
  content: string;
  timestamp: Date;
  type: 'question' | 'answer';
}

export async function saveMessage(message: Message) {
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection('messages').insertOne({
      ...message,
      timestamp: new Date()
    });
    console.log('Message saved successfully:', result.insertedId);
    return result;
  } catch (error) {
    console.error('Failed to save message:', error);
    throw error;
  }
}

export async function getMessages() {
  try {
    const { db } = await connectToDatabase();
    const messages = await db.collection('messages')
      .find()
      .sort({ timestamp: -1 })
      .toArray();
    console.log(`Retrieved ${messages.length} messages`);
    return messages;
  } catch (error) {
    console.error('Failed to retrieve messages:', error);
    throw error;
  }
}