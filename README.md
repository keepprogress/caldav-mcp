# caldav-mcp

<div align="center">

🗓️ A CalDAV & Apple Reminders Model Context Protocol (MCP) server to expose calendar and reminder operations as tools for AI assistants.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

</div>

## ✨ Features

### CalDAV Integration
- Connect to CalDAV servers
- Create, list, and delete calendar events
- List available calendars
- Support for recurring events

### Apple Reminders Integration (macOS only)
- List reminders from any list
- Create new reminders with due dates and priorities
- Mark reminders as complete
- Update existing reminders
- Delete reminders
- List all available reminder lists

## Setup

```
{
  "mcpServers": {
    ...,
    "calendar": {
      "command": "npx",
      "args": [
        "caldav-mcp"
      ],
      "env": {
        "CALDAV_BASE_URL": "<CalDAV server URL>",
        "CALDAV_USERNAME": "<CalDAV username>",
        "CALDAV_PASSWORD": "<CalDAV password>",
        "ENABLE_REMINDERS": "true"
      }
    }
  }
}
```

Note: Apple Reminders integration only works on macOS. Set `ENABLE_REMINDERS` to `false` to disable on other platforms.

## Usage

1. Compile TypeScript to JavaScript:
```bash
npx tsc
```

2. Run the MCP server:
```bash
node index.js
```

## Available Tools

### CalDAV Tools

#### create-event
Creates a new calendar event.

Parameters:
- `summary`: String - Event title/summary
- `start`: DateTime string - Event start time
- `end`: DateTime string - Event end time
- `calendarUrl`: String - Calendar URL
- `recurrenceRule`: Object (optional) - Recurrence settings

#### list-events
Lists events within a specified timeframe.

Parameters:
- `start`: DateTime string - Start of the timeframe
- `end`: DateTime string - End of the timeframe
- `calendarUrl`: String - Calendar URL

#### delete-event
Deletes a calendar event.

Parameters:
- `uid`: String - Event unique ID
- `calendarUrl`: String - Calendar URL

#### list-calendars
Lists all available calendars.

### Apple Reminders Tools (macOS only)

#### list-reminders
List todos from Apple Reminders.

Parameters:
- `list`: String (optional) - Name of the reminder list (default: 'Reminders')
- `showCompleted`: Boolean (optional) - Include completed reminders
- `search`: String (optional) - Search term to filter reminders

#### create-reminder
Create a new reminder in Apple Reminders.

Parameters:
- `title`: String - Title of the reminder
- `list`: String (optional) - Target list name (default: 'Reminders')
- `dueDate`: DateTime string (optional) - Due date in ISO format
- `notes`: String (optional) - Additional notes
- `priority`: Number (optional) - Priority level (0=none, 1=low, 2=medium, 3=high)

#### complete-reminder
Mark a reminder as completed.

Parameters:
- `title`: String - Title of the reminder to complete
- `list`: String (optional) - List containing the reminder

#### update-reminder
Update an existing reminder.

Parameters:
- `title`: String - Current title of the reminder
- `list`: String (optional) - List containing the reminder
- `newTitle`: String (optional) - New title
- `dueDate`: DateTime string (optional) - New due date
- `notes`: String (optional) - New notes
- `priority`: Number (optional) - New priority level
- `completed`: Boolean (optional) - Mark as completed/uncompleted

#### delete-reminder
Delete a reminder from Apple Reminders.

Parameters:
- `title`: String - Title of the reminder to delete
- `list`: String (optional) - List containing the reminder

#### list-reminder-lists
Get all available reminder lists.

## License

MIT