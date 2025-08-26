# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project is a CalDAV and Apple Reminders client using the Model Context Protocol (MCP) server to expose calendar and reminder operations as tools. It uses:

- **ts-caldav**: A TypeScript CalDAV client for interacting with calendar servers
- **node-reminders**: A TypeScript wrapper for macOS Reminders App (Apple Reminders integration)
- **MCP SDK**: Model Context Protocol for creating tools that can be used by AI assistants
- **dotenv**: For environment variable management

## Architecture

### Core Components

1. **CalDAV Integration** (Existing)
   - Located in `src/tools/` directory
   - Tools: create-event, list-events, delete-event, list-calendars
   - Uses ts-caldav library for CalDAV protocol communication

2. **Apple Reminders Integration** (New)
   - Located in `src/tools/reminders/` directory
   - Tools: list-reminders, create-reminder, update-reminder, delete-reminder, complete-reminder, list-reminder-lists
   - Uses node-reminders library which wraps JXA (JavaScript for Automation) scripts

### Tool Registration Pattern

All tools follow this consistent pattern:

```typescript
export function registerToolName(client: ClientType, server: McpServer) {
  server.tool(
    "tool-name",
    "Tool description",
    {
      // Zod schema for parameters
    },
    async (params) => {
      // Implementation
      return {
        content: [{ type: "text", text: result }],
      }
    }
  )
}
```

## Environment Setup

The project requires the following environment variables in a `.env` file:

```bash
# CalDAV Configuration
CALDAV_BASE_URL=<CalDAV server URL>
CALDAV_USERNAME=<CalDAV username>
CALDAV_PASSWORD=<CalDAV password>

# Apple Reminders Configuration (optional)
ENABLE_REMINDERS=true  # Set to false to disable Apple Reminders features
```

## Apple Reminders Integration Implementation Guide

### Prerequisites
- **Platform**: macOS only (node-reminders uses JXA which is macOS-specific)
- **Permissions**: The app needs permission to access Reminders

### Implementation Steps

#### 1. Install Dependencies
```bash
npm install node-reminders
npm install --save-dev @types/node-reminders  # If types are available
```

#### 2. Create Reminder Tool Files

Create the following structure:
```
src/tools/reminders/
├── list-reminders.ts
├── create-reminder.ts
├── update-reminder.ts
├── delete-reminder.ts
├── complete-reminder.ts
└── list-reminder-lists.ts
```

#### 3. Tool Implementation Templates

**list-reminders.ts**:
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import Reminders from "node-reminders"

export function registerListReminders(server: McpServer) {
  server.tool(
    "list-reminders",
    "List todos from Apple Reminders",
    {
      list: z.string().optional().describe("Name of the reminder list (default: 'Reminders')"),
      showCompleted: z.boolean().optional().describe("Include completed reminders"),
      search: z.string().optional().describe("Search term to filter reminders"),
    },
    async ({ list, showCompleted, search }) => {
      const reminders = new Reminders()
      const listName = list || "Reminders"
      
      try {
        const allReminders = await reminders.getReminders(listName)
        let filtered = allReminders
        
        if (!showCompleted) {
          filtered = filtered.filter(r => !r.isCompleted)
        }
        
        if (search) {
          filtered = filtered.filter(r => 
            r.title.toLowerCase().includes(search.toLowerCase())
          )
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(filtered, null, 2)
          }],
        }
      } catch (error) {
        throw new Error(`Failed to list reminders: ${error.message}`)
      }
    }
  )
}
```

**create-reminder.ts**:
```typescript
export function registerCreateReminder(server: McpServer) {
  server.tool(
    "create-reminder",
    "Create a new reminder in Apple Reminders",
    {
      title: z.string().describe("Title of the reminder"),
      list: z.string().optional().describe("Target list name (default: 'Reminders')"),
      dueDate: z.string().datetime().optional().describe("Due date in ISO format"),
      notes: z.string().optional().describe("Additional notes for the reminder"),
      priority: z.number().min(0).max(3).optional().describe("Priority level (0-3)"),
    },
    async ({ title, list, dueDate, notes, priority }) => {
      const reminders = new Reminders()
      const listName = list || "Reminders"
      
      try {
        const reminderData = {
          title,
          notes,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          priority,
        }
        
        const result = await reminders.addReminder(listName, reminderData)
        
        return {
          content: [{
            type: "text",
            text: `Created reminder: ${result.id}`
          }],
        }
      } catch (error) {
        throw new Error(`Failed to create reminder: ${error.message}`)
      }
    }
  )
}
```

**complete-reminder.ts**:
```typescript
export function registerCompleteReminder(server: McpServer) {
  server.tool(
    "complete-reminder",
    "Mark a reminder as completed",
    {
      title: z.string().describe("Title of the reminder to complete"),
      list: z.string().optional().describe("List containing the reminder"),
    },
    async ({ title, list }) => {
      const reminders = new Reminders()
      const listName = list || "Reminders"
      
      try {
        const allReminders = await reminders.getReminders(listName)
        const target = allReminders.find(r => r.title === title)
        
        if (!target) {
          throw new Error(`Reminder '${title}' not found in list '${listName}'`)
        }
        
        await reminders.updateReminder(target.id, { isCompleted: true })
        
        return {
          content: [{
            type: "text",
            text: `Completed reminder: ${title}`
          }],
        }
      } catch (error) {
        throw new Error(`Failed to complete reminder: ${error.message}`)
      }
    }
  )
}
```

#### 4. Update Main Index

Modify `src/index.ts`:
```typescript
import { registerListReminders } from "./tools/reminders/list-reminders.js"
import { registerCreateReminder } from "./tools/reminders/create-reminder.js"
import { registerCompleteReminder } from "./tools/reminders/complete-reminder.js"
// ... other imports

async function main() {
  // ... existing CalDAV setup
  
  // Register CalDAV tools
  registerCreateEvent(client, server)
  registerListEvents(client, server)
  registerDeleteEvent(client, server)
  await registerListCalendars(client, server)
  
  // Register Apple Reminders tools (if enabled)
  if (process.env.ENABLE_REMINDERS === 'true') {
    registerListReminders(server)
    registerCreateReminder(server)
    registerCompleteReminder(server)
    registerUpdateReminder(server)
    registerDeleteReminder(server)
    registerListReminderLists(server)
  }
  
  // ... rest of the setup
}
```

## Common Commands

```bash
# Install dependencies
npm install

# Compile TypeScript to JavaScript
npx tsc

# Run the MCP server
node dist/index.js

# Run tests
npm test

# Watch mode for development
npm run watch

# Lint code
npm run lint

# Format code
npm run format
```

## Error Handling Guidelines

1. **Permission Errors**: Check if the app has Reminders access permission
2. **Platform Errors**: node-reminders only works on macOS
3. **List Not Found**: Verify the list name exists before operations
4. **Reminder Not Found**: Use exact title matching or implement fuzzy search

## Testing Strategy

1. **Unit Tests**: Mock node-reminders calls for tool handlers
2. **Integration Tests**: Test actual Apple Reminders operations (macOS only)
3. **Error Cases**: Test permission denials, missing lists, duplicate titles

## Performance Considerations

- node-reminders uses JXA which can be slower than native implementations
- Consider caching list names to avoid repeated queries
- Batch operations when possible to reduce overhead

## Security Best Practices

1. Never log sensitive reminder content in production
2. Validate all input parameters before passing to node-reminders
3. Handle permission requests gracefully
4. Sanitize reminder content to prevent injection attacks

## Platform Limitations

- **macOS Only**: Apple Reminders integration only works on macOS
- **No CalDAV**: Apple Reminders doesn't support CalDAV since iOS 13
- **JXA Limitations**: Some advanced Reminders features may not be accessible
- **List Deletion**: Cannot delete reminder lists programmatically

## Future Enhancements

1. Add support for reminder attachments
2. Implement recurring reminders
3. Add location-based reminders (if supported by JXA)
4. Create a platform detection mechanism to gracefully disable on non-macOS
5. Consider Swift-based implementation for better performance
6. Add reminder search with advanced filters
7. Implement reminder templates

## Troubleshooting

### Common Issues

1. **"Permission denied" error**
   - Solution: Grant Reminders access in System Preferences > Privacy & Security

2. **"node-reminders not found" error**
   - Solution: Ensure npm install completed successfully
   - Check if running on macOS

3. **"List not found" error**
   - Solution: Use list-reminder-lists tool to get available lists
   - Check for typos in list names

4. **Reminders not syncing**
   - Solution: Check iCloud sync settings
   - Ensure Reminders app is signed into iCloud

## Code Style Guidelines

1. Use TypeScript strict mode
2. Follow existing tool registration patterns
3. Include comprehensive error messages
4. Add JSDoc comments for all exported functions
5. Use async/await instead of promises
6. Validate inputs using Zod schemas
7. Return consistent response formats

## Contributing

When adding new reminder features:
1. Follow the existing tool pattern
2. Add comprehensive tests
3. Update this documentation
4. Test on macOS before committing
5. Consider backwards compatibility