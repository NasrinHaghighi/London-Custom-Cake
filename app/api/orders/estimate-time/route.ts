import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import ProductType from '@/lib/models/productTypeSchema';
import { calculateProductionTime } from '@/lib/models/productTypeSchema';
import { estimateOrderProductionTimeSchema } from '@/lib/validators/order';
import logger from '@/lib/logger';
import { z } from 'zod';

function formatMinutesLabel(totalMinutes: number): string {
  const rounded = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const requestBody = await request.json();
    const validated = estimateOrderProductionTimeSchema.parse(requestBody);

    const productTypeIds = [...new Set(validated.items.map((item) => item.productTypeId))];
    const productTypes = await ProductType.find({ _id: { $in: productTypeIds } }).lean();
    const productMap = new Map(productTypes.map((product) => [product._id.toString(), product]));

    const itemEstimates = validated.items.map((item, index) => {
      const product = productMap.get(item.productTypeId);
      if (!product) {
        throw new Error(`Product type not found: ${item.productTypeId}`);
      }

      if (product.pricingMethod === 'perunit' && !item.quantity) {
        throw new Error(`Quantity is required for product type: ${product.name}`);
      }

      if (product.pricingMethod === 'perkg' && !item.weight) {
        throw new Error(`Weight is required for product type: ${product.name}`);
      }

      const minutes = calculateProductionTime(product, {
        order_weight: item.weight,
        order_quantity: item.quantity,
      });

      return {
        itemIndex: index,
        productTypeId: item.productTypeId,
        productTypeName: product.name,
        minutes,
      };
    });

    const totalMinutes = itemEstimates.reduce((sum, item) => sum + item.minutes, 0);

    return NextResponse.json({
      success: true,
      itemEstimates,
      totalMinutes,
      totalLabel: formatMinutesLabel(totalMinutes),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`);
      return NextResponse.json({ success: false, message: 'Validation failed', errors }, { status: 400 });
    }

    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Order time estimate failed');
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to estimate production time',
    }, { status: 500 });
  }
}
