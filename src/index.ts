#!/usr/bin/env node

import 'dotenv/config'
import { CalDAVClient } from "ts-caldav";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";


const server = new McpServer({
  name: "caldav-mcp",
  version: "0.1.0"
});

async function main() {
  const client = await CalDAVClient.create({
    baseUrl: process.env.CALDAV_BASE_URL || "",
    auth: {
      type: "basic",
      username: process.env.CALDAV_USERNAME || "",
      password: process.env.CALDAV_PASSWORD || ""
    }
  });

  const calendars = await client.getCalendars();

  server.tool(
    "create-event",
    "Creates an event in the calendar specified by its URL",
    {summary: z.string(), start: z.string().datetime(), end: z.string().datetime(), calendarUrl: z.string()},
    async ({calendarUrl, summary, start, end}) => {
      const event = await client.createEvent(calendarUrl, {
        summary: summary,
        start: new Date(start),
        end: new Date(end),
      });
      return {
        content: [{type: "text", text: event.uid}]
      };
    }
  );


  server.tool(
    "list-events",
    "List all events between start and end date in the calendar specified by its URL",
    {start: z.string().datetime(), end: z.string().datetime(), calendarUrl: z.string()},
    async ({calendarUrl, start, end}) => {
      const allEvents = await client.getEvents(calendarUrl);

      // Filter events that fall within the specified time range
      const startDate = new Date(start);
      const endDate = new Date(end);

      const filteredEvents = allEvents.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // Event starts before the end time and ends after the start time
        return eventStart <= endDate && eventEnd >= startDate;
      });

      const data = filteredEvents.map(e => ({summary: e.summary, start: e.start, end: e.end}));
      return {
        content: [{type: "text", text: JSON.stringify(data)}]
      };
    }
  );

  server.tool(
    "delete-event",
    "Deletes an event in the calendar specified by its URL",
    {uid: z.string(), calendarUrl: z.string()},
    async ({uid, calendarUrl}) => {
      await client.deleteEvent(calendarUrl, uid);
      return {
        content: [{type: "text", text: "Event deleted"}]
      };
    }
  );

  server.tool(
    "list-calendars",
    "List all calendars returning both name and URL",
    {},
    async () => {
      const data = calendars.map(c => ({name: c.displayName, url: c.url}));
      return {content: [{type: "text", text: JSON.stringify(data)}]};
    }
  )

  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main()