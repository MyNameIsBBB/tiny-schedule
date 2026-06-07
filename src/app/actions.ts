"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { signJWT } from "@/lib/jwt";
import { redirect } from "next/navigation";

export async function loginUser(password: string) {
  const expectedPassword = process.env.APP_PASSWORD || "admin123";
  const jwtSecret = process.env.JWT_SECRET || "tinyschedule-super-secret-key";

  if (password === expectedPassword) {
    const payload = {
      authenticated: true,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };
    
    const token = await signJWT(payload, jwtSecret);
    
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/"
    });

    return { success: true };
  }
  
  return { success: false, error: "Incorrect password" };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}


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
    
    const deadlineStr = formData.get("deadline") as string;
    const deadline = deadlineStr ? new Date(deadlineStr) : null;
    
    const estMinsStr = formData.get("estimatedMinutes") as string;
    const estimatedMinutes = estMinsStr ? parseInt(estMinsStr) : null;
    
    await prisma.task.create({
      data: {
        userId,
        title,
        tags,
        status: "TODO",
        deadline,
        estimatedMinutes
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

export async function deleteTask(taskId: string) {
  try {
    await prisma.task.delete({
      where: { id: taskId }
    });
    revalidatePath("/");
    revalidatePath("/tasks");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "Failed to delete task" };
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
    
    const dateStr = formData.get("date") as string;
    const startTimeStr = formData.get("startTime") as string;
    const endTimeStr = formData.get("endTime") as string;

    const startTime = new Date(`${dateStr}T${startTimeStr}:00`);
    const endTime = new Date(`${dateStr}T${endTimeStr}:00`);

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

export async function deleteSchedule(scheduleId: string) {
  try {
    await prisma.schedule.delete({
      where: { id: scheduleId }
    });
    revalidatePath("/");
    revalidatePath("/schedule");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return { success: false, error: "Failed to delete schedule" };
  }
}
