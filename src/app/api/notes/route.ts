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
    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ success: true, data: notes });
  } catch (error: any) {
    console.error("Failed to fetch notes from API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, type = "SANDBOX", imageUrl = null } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title or content" },
        { status: 400 }
      );
    }

    const userId = await getDefaultUserId();

    const note = await prisma.note.create({
      data: {
        userId,
        title,
        content,
        type,
        imageUrl
      }
    });

    revalidatePath("/");
    revalidatePath("/notes");

    return NextResponse.json({ success: true, data: note });
  } catch (error: any) {
    console.error("Failed to create note from API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create note" },
      { status: 500 }
    );
  }
}
