#!/usr/bin/env node

import "dotenv/config"
import { CalDAVClient } from "ts-caldav"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { registerCreateEvent } from "./tools/create-event.js"

const server = new McpServer({
  name: "caldav-mcp",
  version: "0.1.0",
})

const dateString = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid date string",
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

  const calendars = await client.getCalendars()

  server.tool(
    "list-events",
    "List all events between start and end date in the calendar specified by its URL",
    { start: dateString, end: dateString, calendarUrl: z.string() },
    async ({ calendarUrl, start, end }) => {
      const options = {
        start: new Date(start),
        end: new Date(end),
      }
      const allEvents = await client.getEvents(calendarUrl, options)
      const data = allEvents.map((e) => ({
        summary: e.summary,
        start: e.start,
        end: e.end,
      }))
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      }
    },
  )

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
