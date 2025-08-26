import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

// Schema definition extracted to reduce complexity in main function
const updateReminderSchema = {
  title: z.string().describe("Current title of the reminder to update"),
  listName: z.string().optional().describe("List containing the reminder (searches all lists if not specified)"),
  newTitle: z.string().optional().describe("New title for the reminder"),
  dueDate: z.string().datetime().optional().describe("New due date in ISO format"),
  notes: z.string().optional().describe("New notes for the reminder"),
  priority: z.number().min(0).max(3).optional().describe("New priority level (0=none, 1=low, 2=medium, 3=high)"),
  completed: z.boolean().optional().describe("Mark reminder as completed or uncompleted"),
}

// Helper function to find reminder in a specific list
async function findReminderInList(lists: any[], listName: string, title: string) {
  const targetList = lists.find(l => l.name.toLowerCase() === listName.toLowerCase())
  if (!targetList) {
    throw new Error(`List '${listName}' not found`)
  }

  const { getReminders } = await import("node-reminders")
  const reminders = await getReminders(targetList.id)
  const targetReminder = reminders.find((r: any) => r.name === title)

  return { targetReminder, foundListName: targetList.name }
}

// Helper function to find reminder across all lists
async function findReminderInAllLists(lists: any[], title: string) {
  const { getReminders } = await import("node-reminders")

  const searchPromises = lists.map(async (list) => {
    const reminders = await getReminders(list.id)
    const targetReminder = reminders.find((r: any) => r.name === title)
    return targetReminder ? { targetReminder, foundListName: list.name } : null
  })

  const results = await Promise.all(searchPromises)
  const foundResult = results.find(result => result !== null)

  return foundResult || { targetReminder: null, foundListName: "" }
}

// Simplified helper function to build updates object using Object.assign
function buildUpdatesObject(params: {
  newTitle?: string
  notes?: string
  dueDate?: string
  priority?: number
  completed?: boolean
}) {
  const updates: any = {}

  // Use Object.assign to reduce conditional complexity
  Object.assign(updates,
    params.newTitle !== undefined && { name: params.newTitle },
    params.notes !== undefined && { body: params.notes },
    params.dueDate !== undefined && { dueDate: new Date(params.dueDate).toISOString() },
    params.priority !== undefined && { priority: params.priority },
    params.completed !== undefined && { completed: params.completed }
  )

  return updates
}

// Helper function to search for reminder
async function searchForReminder(lists: any[], listName: string | undefined, title: string) {
  return listName
    ? await findReminderInList(lists, listName, title)
    : await findReminderInAllLists(lists, title)
}

// Helper function to validate reminder exists
function validateReminderFound(targetReminder: any, title: string, listName?: string) {
  if (!targetReminder) {
    const location = listName ? ` in list '${listName}'` : ' in any list'
    throw new Error(`Reminder '${title}' not found${location}`)
  }
}

// Helper function to create success response
function createSuccessResponse(newTitle: string | undefined, title: string, foundListName: string) {
  const updatedTitle = newTitle || title
  return {
    content: [{
      type: "text",
      text: `Successfully updated reminder: "${updatedTitle}" in list "${foundListName}"`
    }],
  }
}

// Main handler function extracted to reduce complexity
async function handleUpdateReminder(params: {
  title: string
  listName?: string
  newTitle?: string
  dueDate?: string
  notes?: string
  priority?: number
  completed?: boolean
}) {
  const { getLists, updateReminder } = await import("node-reminders")

  const lists = await getLists()
  const { targetReminder, foundListName } = await searchForReminder(lists, params.listName, params.title)

  validateReminderFound(targetReminder, params.title, params.listName)

  const updates = buildUpdatesObject(params)
  await updateReminder(targetReminder.id, updates)

  return createSuccessResponse(params.newTitle, params.title, foundListName)
}

export function registerUpdateReminder(server: McpServer) {
  server.tool(
    "update-reminder",
    "Update an existing reminder",
    updateReminderSchema,
    async (params) => {
      try {
        return await handleUpdateReminder(params)
      } catch (error: any) {
        throw new Error(`Failed to update reminder: ${error.message}`)
      }
    }
  )
}