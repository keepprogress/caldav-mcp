#!/usr/bin/env node

import "dotenv/config"
import { CalDAVClient } from "ts-caldav"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { registerCreateEvent } from "./tools/create-event.js"
import { registerListEvents } from "./tools/list-events.js"

const server = new McpServer({
  name: "caldav-mcp",
  version: "0.1.0",
})

async function main() {
  const client = await CalDAVClient.create({
    baseUrl: process.env.CALDAV_BASE_URL || "",
    auth: {
      type: "basic",
      username: process.env.CALDAV_USERNAME || "",
      password: process.env.CALDAV_PASSWORD || "",
    },
  })

  registerCreateEvent(client, server)
  registerListEvents(client, server)

  const calendars = await client.getCalendars()

  server.tool(
    "delete-event",
    "Deletes an event in the calendar specified by its URL",
    { uid: z.string(), calendarUrl: z.string() },
    async ({ uid, calendarUrl }) => {
      await client.deleteEvent(calendarUrl, uid)
      return {
        content: [{ type: "text", text: "Event deleted" }],
      }
    },
  )

  server.tool(
    "list-calendars",
    "List all calendars returning both name and URL",
    {},
    async () => {
      const data = calendars.map((c) => ({ name: c.displayName, url: c.url }))
      return { content: [{ type: "text", text: JSON.stringify(data) }] }
    },
  )

  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main()
