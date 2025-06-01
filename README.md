# MCP Registry & Tester

A Next.js application for registering and testing Model Context Protocol (MCP) servers. This application allows you to:

- Register MCP servers with custom URLs and headers
- List all registered MCP servers
- Connect to MCP servers and discover their tools
- Test MCP tools with custom arguments
- Support multiple transport protocols (stdio, HTTPS/Streamable HTTP)

## Prerequisites

- Node.js 18+ 
- Docker for PostgreSQL database
- PostgreSQL database running locally

## Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd mcp-tester
   npm install
   ```

2. **Start PostgreSQL database:**
   ```bash
   # If you have an existing PostgreSQL container, create the database:
   docker exec -it <your-postgres-container> psql -U postgres -c "CREATE DATABASE mcp_registry;"
   
   # Or start a new one with our docker-compose.yml:
   docker-compose up -d
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the project root:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mcp_registry"
   ```

4. **Run database migrations:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open the application:**
   Visit [http://localhost:3000](http://localhost:3000)

## Features

### 1. Main Page (/)
- Lists all registered MCP servers
- Shows server details including URL, description, and custom headers
- Quick access to register new servers or interact with existing ones

### 2. Register Page (/register)
- Form to register new MCP servers
- Fields for name, description, URL, and custom headers
- Dynamic header addition/removal

### 3. Edit Page (/edit/[id])
- Pre-loads existing server data for editing
- Same interface as register page
- Updates server configuration

### 4. MCP Interaction Page (/mcp/[id])
- Connect to a specific MCP server
- Discover available tools and resources
- Test tools with custom JSON arguments
- View call history with results/errors
- Override headers for testing different authentication tokens

## Supported Transport Protocols

The application supports multiple MCP transport protocols through a modular connection architecture:

### 1. Local Servers (stdio://)
For local MCP servers that run as processes:

```
stdio://node /path/to/your/server.js
stdio://python /path/to/your/server.py
stdio://uvx mcp-server-git --repository /path/to/repo
```

**Examples:**
- `stdio://node weather-server.js` - Node.js weather server
- `stdio://python filesystem-server.py` - Python filesystem server
- `stdio://uvx mcp-server-postgres postgresql://user:pass@localhost/db` - PostgreSQL server

### 2. HTTP/HTTPS Servers with Streamable HTTP
For remote MCP servers accessible via HTTP/HTTPS using Streamable HTTP transport:

```
https://api.example.com/mcp
https://your-server.herokuapp.com/mcp
http://localhost:3001/mcp
```

**Key Features:**
- **Streamable connections** using HTTP with bidirectional communication
- **Custom headers** support for authentication
- **Real-time communication** with remote MCP servers
- **Session management** and connection persistence

**Example HTTPS URLs:**
- `https://mcp-server.example.com/mcp` - Remote MCP server with Streamable HTTP
- `https://api.weather.com/mcp` - Weather API with MCP interface
- `http://localhost:8080/mcp` - Local development server

## MCP Connection Architecture

The application uses a modular transport architecture with separate classes for each protocol:

### File Structure
```
src/lib/
├── mcp-client.ts              # Main connection manager
└── transports/
    ├── index.ts               # Barrel exports
    ├── base-transport.ts      # Base interfaces & abstract class
    ├── stdio-transport.ts     # Stdio protocol implementation
    └── http-transport.ts      # HTTP/HTTPS protocol implementation
```

### Architecture Features
- **Modular Design** - Each transport protocol is in its own file
- **Type Safety** - TypeScript interfaces for all MCP operations
- **Extensible** - Easy to add new transport protocols
- **Automatic Protocol Detection** - Selects appropriate transport based on URL
- **Error Handling** - Detailed error messages for troubleshooting
- **Connection Management** - Automatic connection lifecycle management

### Connection Flow

1. **URL Detection** - Automatically detects protocol from URL scheme
2. **Transport Selection** - Selects appropriate transport class (stdio, HTTP, etc.)
3. **Client Connection** - Establishes MCP protocol connection
4. **Capability Discovery** - Lists available tools and resources
5. **Tool Execution** - Handles tool calls with proper argument passing
6. **Connection Cleanup** - Automatically closes connections

## Creating MCP Servers

### For stdio:// connections

1. **Use existing MCP servers:**
   ```bash
   # Install an official MCP server
   npm install -g @modelcontextprotocol/server-filesystem
   
   # Register it with URL: stdio://mcp-server-filesystem /path/to/directory
   ```

2. **Create a simple MCP server:**
   ```bash
   # Install MCP SDK
   npm install @modelcontextprotocol/sdk
   
   # Create a server following the MCP documentation
   # Register it with URL: stdio://node your-server.js
   ```

### For https:// connections

1. **Deploy MCP server with Streamable HTTP endpoint:**
   ```typescript
   // Example Express.js server with Streamable HTTP
   import express from 'express';
   import { Server } from '@modelcontextprotocol/sdk/server/index.js';
   import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
   
   const app = express();
   
   app.all('/mcp', async (req, res) => {
     const transport = new StreamableHTTPServerTransport({
       sessionIdGenerator: () => randomUUID(),
     });
     const server = new Server({ name: 'my-server', version: '1.0.0' });
     await server.connect(transport);
     await transport.handleRequest(req, res, req.body);
   });
   ```

2. **Register with HTTPS URL:**
   ```
   https://your-domain.com/mcp
   ```

3. **Add authentication headers if needed:**
   - Authorization: Bearer your-token
   - X-API-Key: your-api-key

## Database Schema

The application uses PostgreSQL with Drizzle ORM. The main table structure:

```sql
CREATE TABLE mcp_servers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## API Routes

- `GET /api/mcp-servers` - List all servers
- `POST /api/mcp-servers` - Create new server
- `GET /api/mcp-servers/[id]` - Get server details
- `PUT /api/mcp-servers/[id]` - Update server
- `POST /api/mcp-connect` - Connect to MCP server (all protocols)
- `POST /api/mcp-call-tool` - Call MCP tool (all protocols)

## Transport Implementation Details

### stdio:// Transport
- Uses `StdioClientTransport` from MCP SDK
- Spawns local processes with command-line arguments
- Communicates via stdin/stdout pipes
- Best for local development and testing

### https:// Transport
- Uses `StreamableHTTPClientTransport` from MCP SDK
- Establishes bidirectional HTTP communication
- Supports custom headers for authentication
- Enables real-time streaming communication
- Session-based connection management
- Suitable for production deployments

### Future Transport Support
- WebSocket (`ws://`, `wss://`) - Planned
- gRPC - Under consideration
- Custom protocols - Extensible architecture

## Technologies Used

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Drizzle ORM
- **MCP Integration:** @modelcontextprotocol/sdk
- **Transport Protocols:** stdio, Streamable HTTP
- **Development:** Docker for PostgreSQL

## Database Scripts

```bash
# Generate migrations after schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Open Drizzle Studio for database management
npm run db:studio
```

## Development Notes

- The application uses App Router (Next.js 13+)
- TypeScript is configured with strict mode
- Tailwind CSS provides styling
- Modular MCP connection architecture with separate transport files
- Real MCP protocol implementation for stdio:// and https:// URLs
- Each transport protocol is implemented in its own class

## Troubleshooting

### MCP Connection Issues

1. **stdio:// servers:**
   - Verify the executable path is correct
   - Ensure the server file exists and is executable
   - Check that required dependencies are installed

2. **https:// servers:**
   - Verify the server URL is accessible
   - Check that the server supports Streamable HTTP transport
   - Ensure CORS is properly configured on the server
   - Verify authentication headers if required

3. **Tool call failures:**
   - Verify the tool name exists on the server
   - Check that arguments match the tool's schema
   - Review server logs for errors

### Example Working Servers

**Local (stdio://):**
```bash
stdio://node weather-server.js
stdio://uvx mcp-server-filesystem /path/to/directory
stdio://uvx mcp-server-git --repository /path/to/git/repo
```

**Remote (https://):**
```bash
https://api.example.com/mcp
https://mcp-server.herokuapp.com/mcp
http://localhost:8080/mcp
```

## Adding New Transport Protocols

The modular architecture makes it easy to add new transport protocols:

1. **Create a new transport file:**
   ```typescript
   // src/lib/transports/websocket-transport.ts
   import { BaseMcpTransport } from './base-transport.js';
   
   export class WebSocketMcpTransport extends BaseMcpTransport {
     supportsProtocol(url: string): boolean {
       return url.startsWith('ws://') || url.startsWith('wss://');
     }
     
     async connect(url: string, headers?: Record<string, string>) {
       // WebSocket implementation
     }
     
     async callTool(url: string, toolName: string, toolArgs: any, headers?: Record<string, string>) {
       // WebSocket tool call implementation
     }
   }
   ```

2. **Register the transport:**
   ```typescript
   import { McpConnectionManager } from '@/lib/mcp-client';
   import { WebSocketMcpTransport } from '@/lib/transports/websocket-transport';
   
   McpConnectionManager.registerTransport(new WebSocketMcpTransport());
   ```

## Future Enhancements

- WebSocket transport support (`ws://`, `wss://`)
- Connection pooling and session persistence
- Server status monitoring and health checks
- Resource browsing and interaction UI
- Authentication and authorization middleware
- Bulk import/export of server configurations
- Advanced tool testing with schema validation
- Real-time server monitoring dashboard
