import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export function registerListReminders(server: McpServer) {
  server.tool(
    "list-reminders",
    "List todos from Apple Reminders",
    {
      listName: z.string().optional().describe("Name of the reminder list (if not specified, will list available lists)"),
      showCompleted: z.boolean().optional().describe("Include completed reminders"),
      search: z.string().optional().describe("Search term to filter reminders"),
    },
    async ({ listName, showCompleted, search }) => {
      const { getLists, getReminders } = await import("node-reminders")
      
      try {
        // If no list specified, return available lists
        if (!listName) {
          const lists = await getLists()
          return {
            content: [{
              type: "text",
              text: "Available reminder lists:\n" + JSON.stringify(lists.map(l => ({ id: l.id, name: l.name })), null, 2)
            }],
          }
        }
        
        // Find the list by name
        const lists = await getLists()
        const targetList = lists.find(l => l.name.toLowerCase() === listName.toLowerCase())
        
        if (!targetList) {
          throw new Error(`List '${listName}' not found. Available lists: ${lists.map(l => l.name).join(', ')}`)
        }
        
        // Get reminders from the list
        const allReminders = await getReminders(targetList.id)
        let filtered = [...allReminders]
        
        if (!showCompleted) {
          filtered = filtered.filter((r: any) => !r.completed)
        }
        
        if (search) {
          filtered = filtered.filter((r: any) => 
            r.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.body?.toLowerCase().includes(search.toLowerCase())
          )
        }
        
        const formattedReminders = filtered.map((r: any) => ({
          id: r.id,
          title: r.name,
          notes: r.body,
          completed: r.completed,
          completionDate: r.completionDate,
          dueDate: r.dueDate,
          priority: r.priority,
          list: listName
        }))
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(formattedReminders, null, 2)
          }],
        }
      } catch (error: any) {
        throw new Error(`Failed to list reminders: ${error.message}`)
      }
    }
  )
}