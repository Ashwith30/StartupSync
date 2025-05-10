import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'cofounder-compass';

let cachedClient: MongoClient;
let cachedDb: any;

export async function connectToDatabase() {
  try {
    if (cachedClient && cachedDb) {
      console.log('Using cached database connection');
      return { client: cachedClient, db: cachedDb };
    }

    console.log('Establishing new database connection...');
    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    console.log('Database connection established successfully');
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}