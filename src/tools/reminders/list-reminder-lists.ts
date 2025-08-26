import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

export function registerListReminderLists(server: McpServer) {
  server.tool(
    "list-reminder-lists",
    "Get all available reminder lists",
    {},
    async () => {
      const { getLists } = await import("node-reminders")
      
      try {
        const lists = await getLists()
        
        const formattedLists = lists.map((list: any) => ({
          id: list.id,
          name: list.name,
          color: list.color,
          emblem: list.emblem
        }))
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(formattedLists, null, 2)
          }],
        }
      } catch (error: any) {
        throw new Error(`Failed to get reminder lists: ${error.message}`)
      }
    }
  )
}