import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ActivityLog from '@/lib/models/activitylog';

export async function POST(request: Request) {
  await dbConnect();
  const body = await request.json();

  try {
    const log = new ActivityLog({
      action: body.action,
      performedBy: body.performedBy,
      targetAdmin: body.targetAdmin,
      details: body.details,
      timestamp: new Date(),
    });
    await log.save();
    return NextResponse.json({ success: true, log });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

export async function GET() {
  await dbConnect();
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
