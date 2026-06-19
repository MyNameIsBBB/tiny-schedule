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
    if (body.content !== undefined) updateData.content = body.content;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;

    const note = await prisma.note.update({
      where: { id },
      data: updateData
    });

    revalidatePath("/");
    revalidatePath("/notes");

    return NextResponse.json({ success: true, data: note });
  } catch (error: any) {
    console.error(`Failed to update note ${id}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update note" },
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
    await prisma.note.delete({
      where: { id }
    });

    revalidatePath("/");
    revalidatePath("/notes");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Failed to delete note ${id}:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete note" },
      { status: 500 }
    );
  }
}
