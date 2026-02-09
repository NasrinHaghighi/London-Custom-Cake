// import { NextResponse } from 'next/server';
// import dbConnect from '../../../lib/mongodb';

// export async function GET() {
//   try {
//     console.log('Attempting to connect to MongoDB...');
//     await dbConnect();
//     console.log('MongoDB connected successfully');
//     return NextResponse.json({ success: true, message: 'MongoDB connected successfully' });
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     return NextResponse.json({ success: false, message: 'MongoDB connection failed', error: error.message }, { status: 500 });
//   }
// }