import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import logger from '@/lib/logger';
import ComplexityThresholdSettings from '@/lib/models/complexityThresholdSettings';
import {
  DEFAULT_COMPLEXITY_THRESHOLDS,
  normalizeComplexityThresholds,
} from '@/lib/complexity';
import { updateComplexityThresholdSettingsSchema } from '@/lib/validators/settings';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const document = await ComplexityThresholdSettings.findOne({ key: 'global' }).lean();
    const thresholds = document
      ? normalizeComplexityThresholds({
          lowMaxMinutes: document.lowMaxMinutes,
          mediumMaxMinutes: document.mediumMaxMinutes,
        })
      : DEFAULT_COMPLEXITY_THRESHOLDS;

    return NextResponse.json({
      success: true,
      thresholds,
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to fetch complexity thresholds');
    return NextResponse.json({ success: false, message: 'Failed to fetch complexity thresholds' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const requestBody = await request.json();
    const validated = updateComplexityThresholdSettingsSchema.parse(requestBody);

    const updated = await ComplexityThresholdSettings.findOneAndUpdate(
      { key: 'global' },
      {
        key: 'global',
        lowMaxMinutes: validated.lowMaxMinutes,
        mediumMaxMinutes: validated.mediumMaxMinutes,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    logger.info(
      {
        updatedBy: auth.user.email,
        lowMaxMinutes: updated.lowMaxMinutes,
        mediumMaxMinutes: updated.mediumMaxMinutes,
      },
      'Updated complexity threshold settings'
    );

    return NextResponse.json({
      success: true,
      message: 'Complexity thresholds updated',
      thresholds: normalizeComplexityThresholds({
        lowMaxMinutes: updated.lowMaxMinutes,
        mediumMaxMinutes: updated.mediumMaxMinutes,
      }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`);
      return NextResponse.json({ success: false, message: 'Validation failed', errors }, { status: 400 });
    }

    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to update complexity thresholds');
    return NextResponse.json({ success: false, message: 'Failed to update complexity thresholds' }, { status: 500 });
  }
}
