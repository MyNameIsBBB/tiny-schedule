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
      include: { parentTask: true },
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
    
    const parentId = formData.get("parentId") as string || null;
    const subtasksJson = formData.get("subtasksJson") as string;
    
    // Parse subtasks
    let subtasks: { id: string; title: string; completed: boolean }[] = [];
    if (subtasksJson) {
      try {
        const parsed = JSON.parse(subtasksJson) as string[];
        subtasks = parsed.map((t, idx) => ({
          id: `${Date.now()}-${idx}`,
          title: t,
          completed: false
        }));
      } catch (e) {
        console.error("Failed to parse subtasks JSON:", e);
      }
    }
    
    await prisma.task.create({
      data: {
        userId,
        title,
        tags,
        status: "TODO",
        deadline,
        parentId,
        subtasks
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

export async function updateTask(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const tagsStr = formData.get("tags") as string;
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()) : [];
    
    const deadlineStr = formData.get("deadline") as string;
    const deadline = deadlineStr ? new Date(deadlineStr) : null;
    
    const subtasksJson = formData.get("subtasksJson") as string;
    
    // Parse subtasks
    let subtasks: { id: string; title: string; completed: boolean }[] = [];
    if (subtasksJson) {
      try {
        const parsed = JSON.parse(subtasksJson) as { id?: string; title: string; completed?: boolean }[];
        subtasks = parsed.map((item, idx) => ({
          id: item.id || `${Date.now()}-${idx}`,
          title: item.title,
          completed: item.completed || false
        }));
      } catch (e) {
        console.error("Failed to parse subtasks JSON:", e);
      }
    }
    
    await prisma.task.update({
      where: { id },
      data: {
        title,
        tags,
        deadline,
        subtasks
      }
    });

    revalidatePath("/");
    revalidatePath("/tasks");
    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { success: false, error: "Failed to update task" };
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

export async function toggleSubtaskStatus(taskId: string, subtaskId: string, currentCompleted: boolean) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });
    if (!task) return { success: false, error: "Task not found" };

    const updatedSubtasks = task.subtasks.map(sub => {
      if (sub.id === subtaskId) {
        return { ...sub, completed: !currentCompleted };
      }
      return sub;
    });

    await prisma.task.update({
      where: { id: taskId },
      data: { subtasks: updatedSubtasks }
    });

    revalidatePath("/");
    revalidatePath("/tasks");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle subtask:", error);
    return { success: false, error: "Failed to toggle subtask" };
  }
}

export async function deleteTask(taskId: string) {
  try {
    // Before deleting, clean up parentId of children to avoid orphan references
    await prisma.task.updateMany({
      where: { parentId: taskId },
      data: { parentId: null }
    });

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
    const isAllDay = formData.get("isAllDay") === "true" || formData.get("isAllDay") === "on";
    const startTimeStr = isAllDay ? "00:00" : (formData.get("startTime") as string || "00:00");
    const endTimeStr = isAllDay ? "23:59" : (formData.get("endTime") as string || "23:59");

    const startTime = new Date(`${dateStr}T${startTimeStr}:00`);
    const endTime = new Date(`${dateStr}T${endTimeStr}:00`);

    const costStr = formData.get("cost") as string;
    const cost = costStr ? parseFloat(costStr) : null;
    const isFixedCost = formData.get("isFixedCost") === "true" || formData.get("isFixedCost") === "on";

    await prisma.schedule.create({
      data: {
        userId,
        title,
        startTime,
        endTime,
        cost,
        isFixedCost,
        isAllDay
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

// ==========================================
// NOTES ACTIONS
// ==========================================

export async function getNotes() {
  try {
    const userId = await getDefaultUserId();
    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" }
    });
    return { success: true, data: notes };
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return { success: false, error: "Failed to fetch notes" };
  }
}

export async function createNote(formData: FormData) {
  try {
    const userId = await getDefaultUserId();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const type = formData.get("type") as string || "SPEC"; // 'SPEC' or 'SANDBOX'

    await prisma.note.create({
      data: {
        userId,
        title,
        content,
        type
      }
    });

    revalidatePath("/notes");
    return { success: true };
  } catch (error) {
    console.error("Failed to create note:", error);
    return { success: false, error: "Failed to create note" };
  }
}

export async function updateNote(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    await prisma.note.update({
      where: { id },
      data: {
        title,
        content
      }
    });

    revalidatePath("/notes");
    return { success: true };
  } catch (error) {
    console.error("Failed to update note:", error);
    return { success: false, error: "Failed to update note" };
  }
}

export async function deleteNote(noteId: string) {
  try {
    await prisma.note.delete({
      where: { id: noteId }
    });
    revalidatePath("/notes");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete note:", error);
    return { success: false, error: "Failed to delete note" };
  }
}

// ==========================================
// WATER INTAKE ACTIONS
// ==========================================

export async function getTodayWater() {
  try {
    const userId = await getDefaultUserId();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const waterLogs = await prisma.waterIntake.findMany({
      where: {
        userId,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    const totalMl = waterLogs.reduce((acc, log) => acc + log.amountMl, 0);
    return { success: true, data: totalMl };
  } catch (error) {
    console.error("Failed to fetch today's water:", error);
    return { success: false, error: "Failed to fetch water logs" };
  }
}

export async function logWater(amountMl: number) {
  try {
    const userId = await getDefaultUserId();
    await prisma.waterIntake.create({
      data: {
        userId,
        amountMl,
        date: new Date()
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to log water:", error);
    return { success: false, error: "Failed to log water" };
  }
}

// ==========================================
// EXPENSE ACTIONS
// ==========================================

export async function getTodayExpenses() {
  try {
    const userId = await getDefaultUserId();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return { success: true, data: expenses };
  } catch (error) {
    console.error("Failed to fetch today's expenses:", error);
    return { success: false, error: "Failed to fetch expenses" };
  }
}

export async function logQuickExpense(category: string, amount: number, title: string) {
  try {
    const userId = await getDefaultUserId();
    await prisma.expense.create({
      data: {
        userId,
        amount,
        category,
        title,
        date: new Date()
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to log expense:", error);
    return { success: false, error: "Failed to log expense" };
  }
}

export async function getWeeklyFixedCosts() {
  try {
    const userId = await getDefaultUserId();
    
    const today = new Date();
    const currentDay = today.getDay(); 
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today.setDate(today.getDate() + distanceToMonday));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const fixedCostSchedules = await prisma.schedule.findMany({
      where: {
        userId,
        isFixedCost: true,
        startTime: {
          gte: monday,
          lte: sunday
        }
      },
      orderBy: { startTime: "asc" }
    });

    return { success: true, data: fixedCostSchedules };
  } catch (error) {
    console.error("Failed to fetch weekly fixed costs:", error);
    return { success: false, error: "Failed to fetch fixed costs" };
  }
}
