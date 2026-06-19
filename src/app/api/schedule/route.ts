import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper to get or create a default user
async function getDefaultUserId() {
  const user = await prisma.user.findFirst({
    where: { email: "default@tinyschedule.com" }
  });
  
  if (user) return user.id;

  const newUser = await prisma.user.create({
    data: {
      email: "default@tinyschedule.com",
      name: "Best"
    }
  });
  
  return newUser.id;
}

export async function GET() {
  try {
    const userId = await getDefaultUserId();
    const schedules = await prisma.schedule.findMany({
      where: { userId },
      orderBy: { startTime: "asc" }
    });
    return NextResponse.json({ success: true, data: schedules });
  } catch (error: any) {
    console.error("Failed to fetch schedules from API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, dateTime, durationMinutes = 60 } = body;

    if (!title || !dateTime) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title or dateTime" },
        { status: 400 }
      );
    }

    const userId = await getDefaultUserId();
    const startTime = new Date(dateTime);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const schedule = await prisma.schedule.create({
      data: {
        userId,
        title,
        startTime,
        endTime,
        isAllDay: false,
        isFixedCost: false,
        isRoutine: false,
        routineDays: []
      }
    });

    revalidatePath("/");
    revalidatePath("/schedule");

    return NextResponse.json({ success: true, data: schedule });
  } catch (error: any) {
    console.error("Failed to create schedule item from API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create schedule item" },
      { status: 500 }
    );
  }
}
