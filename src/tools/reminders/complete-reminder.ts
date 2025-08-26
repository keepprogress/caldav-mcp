import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export function registerCompleteReminder(server: McpServer) {
  server.tool(
    "complete-reminder",
    "Mark a reminder as completed",
    {
      title: z.string().describe("Title of the reminder to complete"),
      listName: z.string().optional().describe("List containing the reminder (searches all lists if not specified)"),
    },
    async ({ title, listName }) => {
      const { getLists, getReminders, updateReminder } = await import("node-reminders")
      
      try {
        const lists = await getLists()
        
        // Search for the reminder across lists
        let targetReminder: any = null
        let foundListName = ""
        
        if (listName) {
          // Search in specific list
          const targetList = lists.find(l => l.name.toLowerCase() === listName.toLowerCase())
          if (!targetList) {
            throw new Error(`List '${listName}' not found`)
          }
          const reminders = await getReminders(targetList.id)
          targetReminder = reminders.find((r: any) => r.name === title && !r.completed)
          foundListName = targetList.name
        } else {
          // Search across all lists
          for (const list of lists) {
            const reminders = await getReminders(list.id)
            targetReminder = reminders.find((r: any) => r.name === title && !r.completed)
            if (targetReminder) {
              foundListName = list.name
              break
            }
          }
        }
        
        if (!targetReminder) {
          const location = listName ? ` in list '${listName}'` : ' in any list'
          throw new Error(`Active reminder '${title}' not found${location}`)
        }
        
        await updateReminder(targetReminder.id, { completed: true })
        
        return {
          content: [{
            type: "text",
            text: `Successfully marked reminder as completed: "${title}" in list "${foundListName}"`
          }],
        }
      } catch (error: any) {
        throw new Error(`Failed to complete reminder: ${error.message}`)
      }
    }
  )
}