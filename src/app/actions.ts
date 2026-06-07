"use server";

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

export async function getTasks() {
  try {
    const userId = await getDefaultUserId();
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: tasks };
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return { success: false, error: "Failed to fetch tasks" };
  }
}

export async function createTask(formData: FormData) {
  try {
    const userId = await getDefaultUserId();
    const title = formData.get("title") as string;
    const tagsStr = formData.get("tags") as string;
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()) : [];
    
    await prisma.task.create({
      data: {
        userId,
        title,
        tags,
        status: "TODO"
      }
    });

    revalidatePath("/");
    revalidatePath("/tasks");
    return { success: true };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function toggleTaskStatus(taskId: string, currentStatus: string) {
  try {
    const newStatus = currentStatus === "COMPLETED" ? "TODO" : "COMPLETED";
    await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus }
    });

    revalidatePath("/");
    revalidatePath("/tasks");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle task:", error);
    return { success: false, error: "Failed to update task" };
  }
}

export async function getSchedules() {
  try {
    const userId = await getDefaultUserId();
    const schedules = await prisma.schedule.findMany({
      where: { userId },
      orderBy: { startTime: "asc" }
    });
    return { success: true, data: schedules };
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    return { success: false, error: "Failed to fetch schedules" };
  }
}

export async function createSchedule(formData: FormData) {
  try {
    const userId = await getDefaultUserId();
    const title = formData.get("title") as string;
    
    // Defaulting to today for demo purposes
    const now = new Date();
    const startTime = new Date(now.setHours(9, 0, 0, 0));
    const endTime = new Date(now.setHours(10, 0, 0, 0));

    await prisma.schedule.create({
      data: {
        userId,
        title,
        startTime,
        endTime
      }
    });

    revalidatePath("/");
    revalidatePath("/schedule");
    return { success: true };
  } catch (error) {
    console.error("Failed to create schedule:", error);
    return { success: false, error: "Failed to create schedule" };
  }
}
