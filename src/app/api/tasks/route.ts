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
    const tasks = await prisma.task.findMany({
      where: { userId },
      include: { parentTask: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error("Failed to fetch tasks from API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, deadline, status = "TODO", tags = [], subtasks = [], parentId = null } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Missing required field: title" },
        { status: 400 }
      );
    }

    const userId = await getDefaultUserId();

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        status,
        tags,
        subtasks,
        parentId
      }
    });

    revalidatePath("/");
    revalidatePath("/tasks");

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error("Failed to create task from API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
