import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ||'';
const MONGODB_DB = process.env.MONGODB_DB || '';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null};

if(!global.mongoose) {
    global.mongoose = cached;
}
    
async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {

    const opts = {
      bufferCommands: false,
    }
    cached.promise = mongoose.connect(`${MONGODB_URI}`, opts).then((mongoose) => {
      console.log('mongodb connected');
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;