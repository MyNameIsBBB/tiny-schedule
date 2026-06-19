import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.startTime !== undefined) updateData.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) updateData.endTime = new Date(body.endTime);
    if (body.isAllDay !== undefined) updateData.isAllDay = body.isAllDay;
    if (body.cost !== undefined) updateData.cost = body.cost;
    if (body.isFixedCost !== undefined) updateData.isFixedCost = body.isFixedCost;
    if (body.isRoutine !== undefined) updateData.isRoutine = body.isRoutine;
    if (body.routineDays !== undefined) updateData.routineDays = body.routineDays;

    const schedule = await prisma.schedule.update({
      where: { id },
      data: updateData
    });

    revalidatePath("/");
    revalidatePath("/schedule");

    return NextResponse.json({ success: true, data: schedule });
  } catch (error: any) {
    console.error(`Failed to update schedule item ${id}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.schedule.delete({
      where: { id }
    });

    revalidatePath("/");
    revalidatePath("/schedule");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Failed to delete schedule item ${id}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
