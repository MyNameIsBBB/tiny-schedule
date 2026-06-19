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
    if (body.description !== undefined) updateData.description = body.description;
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.subtasks !== undefined) updateData.subtasks = body.subtasks;
    if (body.parentId !== undefined) updateData.parentId = body.parentId;

    const task = await prisma.task.update({
      where: { id },
      data: updateData
    });

    revalidatePath("/");
    revalidatePath("/tasks");

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error(`Failed to update task ${id}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update task" },
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
    // Clean up parentId of children to avoid orphan references
    await prisma.task.updateMany({
      where: { parentId: id },
      data: { parentId: null }
    });

    await prisma.task.delete({
      where: { id }
    });

    revalidatePath("/");
    revalidatePath("/tasks");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Failed to delete task ${id}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}
