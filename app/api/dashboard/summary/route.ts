import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/lib/models/admin";
import { authenticateRequest } from "@/lib/auth";

// Simulated database queries (replace with real DB logic, e.g. Prisma)
async function getTotalCakes() {
  // e.g. return prisma.cake.count();
  return 128;
}
async function getTotalOrders() {
  // e.g. return prisma.order.count();
  return 542;
}
async function getPendingOrders() {
  // e.g. return prisma.order.count({ where: { status: "pending" } });
  return 7;
}

async function getTotalAdmins() {
  await dbConnect();
  return Admin.countDocuments();
}

export async function GET(request: NextRequest) {
  // Authenticate request
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return auth.response;
  }

  // Fetch all stats in parallel
  const [totalCakes, totalOrders, pendingOrders, totalAdmins] = await Promise.all([
    getTotalCakes(),
    getTotalOrders(),
    getPendingOrders(),
    getTotalAdmins(),
  ]);

  return NextResponse.json({
    totalCakes,
    totalOrders,
    pendingOrders,
    totalAdmins,
  });
}
