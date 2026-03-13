import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET() {
	try {
		await dbConnect();
		return NextResponse.json({ success: true, message: 'MongoDB connected successfully' });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json(
			{ success: false, message: 'MongoDB connection failed', error: message },
			{ status: 500 }
		);
	}
}