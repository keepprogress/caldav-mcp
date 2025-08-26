import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export function registerCreateReminder(server: McpServer) {
  server.tool(
    "create-reminder",
    "Create a new reminder in Apple Reminders",
    {
      title: z.string().describe("Title of the reminder"),
      listName: z.string().optional().describe("Target list name (default: first available list)"),
      dueDate: z.string().datetime().optional().describe("Due date in ISO format"),
      notes: z.string().optional().describe("Additional notes for the reminder"),
      priority: z.number().min(0).max(3).optional().describe("Priority level (0=none, 1=low, 2=medium, 3=high)"),
    },
    async ({ title, listName, dueDate, notes, priority }) => {
      const { getLists, createReminder } = await import("node-reminders")
      
      try {
        // Find the list or use the first one
        const lists = await getLists()
        if (lists.length === 0) {
          throw new Error("No reminder lists found")
        }
        
        let targetList
        if (listName) {
          targetList = lists.find(l => l.name.toLowerCase() === listName.toLowerCase())
          if (!targetList) {
            throw new Error(`List '${listName}' not found. Available lists: ${lists.map(l => l.name).join(', ')}`)
          }
        } else {
          targetList = lists[0] // Use first available list
        }
        
        const reminderData: any = {
          name: title,
        }
        
        if (notes) reminderData.body = notes
        if (dueDate) reminderData.dueDate = new Date(dueDate).toISOString()
        if (priority !== undefined) reminderData.priority = priority
        
        const reminderId = await createReminder(targetList.id, reminderData)
        
        return {
          content: [{
            type: "text",
            text: `Successfully created reminder: "${title}" in list "${targetList.name}" with ID: ${reminderId}`
          }],
        }
      } catch (error: any) {
        throw new Error(`Failed to create reminder: ${error.message}`)
      }
    }
  )
}