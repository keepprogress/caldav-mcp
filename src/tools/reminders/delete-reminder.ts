import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export function registerDeleteReminder(server: McpServer) {
  server.tool(
    "delete-reminder",
    "Delete a reminder from Apple Reminders",
    {
      title: z.string().describe("Title of the reminder to delete"),
      listName: z.string().optional().describe("List containing the reminder (searches all lists if not specified)"),
    },
    async ({ title, listName }) => {
      const { getLists, getReminders, deleteReminder } = await import("node-reminders")
      
      try {
        const lists = await getLists()
        
        // Search for the reminder
        let targetReminder: any = null
        let foundListName = ""
        
        if (listName) {
          // Search in specific list
          const targetList = lists.find(l => l.name.toLowerCase() === listName.toLowerCase())
          if (!targetList) {
            throw new Error(`List '${listName}' not found`)
          }
          const reminders = await getReminders(targetList.id)
          targetReminder = reminders.find((r: any) => r.name === title)
          foundListName = targetList.name
        } else {
          // Search across all lists
          for (const list of lists) {
            const reminders = await getReminders(list.id)
            targetReminder = reminders.find((r: any) => r.name === title)
            if (targetReminder) {
              foundListName = list.name
              break
            }
          }
        }
        
        if (!targetReminder) {
          const location = listName ? ` in list '${listName}'` : ' in any list'
          throw new Error(`Reminder '${title}' not found${location}`)
        }
        
        await deleteReminder(targetReminder.id)
        
        return {
          content: [{
            type: "text",
            text: `Successfully deleted reminder: "${title}" from list "${foundListName}"`
          }],
        }
      } catch (error: any) {
        throw new Error(`Failed to delete reminder: ${error.message}`)
      }
    }
  )
}