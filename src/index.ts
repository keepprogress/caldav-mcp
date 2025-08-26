#!/usr/bin/env node

import "dotenv/config"
import { CalDAVClient } from "ts-caldav"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { registerCreateEvent } from "./tools/create-event.js"
import { registerDeleteEvent } from "./tools/delete-event.js"
import { registerListCalendars } from "./tools/list-calendars.js"
import { registerListEvents } from "./tools/list-events.js"
import { registerListReminders } from "./tools/reminders/list-reminders.js"
import { registerCreateReminder } from "./tools/reminders/create-reminder.js"
import { registerCompleteReminder } from "./tools/reminders/complete-reminder.js"
import { registerUpdateReminder } from "./tools/reminders/update-reminder.js"
import { registerDeleteReminder } from "./tools/reminders/delete-reminder.js"
import { registerListReminderLists } from "./tools/reminders/list-reminder-lists.js"

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
  registerDeleteEvent(client, server)
  await registerListCalendars(client, server)
  
  // Register Apple Reminders tools (if enabled)
  if (process.env.ENABLE_REMINDERS === 'true' || process.env.ENABLE_REMINDERS === undefined) {
    try {
      registerListReminders(server)
      registerCreateReminder(server)
      registerCompleteReminder(server)
      registerUpdateReminder(server)
      registerDeleteReminder(server)
      registerListReminderLists(server)
      console.error("Apple Reminders tools registered successfully")
    } catch (error) {
      console.error("Warning: Apple Reminders tools could not be registered (macOS only):", error)
    }
  }

  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main()
