import { Client } from '@modelcontextprotocol/sdk/client/index.js';

export interface McpTool {
  name: string;
  description?: string;
  inputSchema: any;
}

export interface McpResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface McpConnectionResult {
  tools: McpTool[];
  resources: McpResource[];
  capabilities: any;
}

export interface McpToolCallResult {
  content: Array<{
    type: string;
    text?: string;
    data?: any;
  }>;
}

// Base interface for all MCP transport implementations
export interface IMcpTransport {
  connect(url: string, headers?: Record<string, string>): Promise<McpConnectionResult>;
  callTool(url: string, toolName: string, toolArgs: any, headers?: Record<string, string>): Promise<McpToolCallResult>;
  supportsProtocol(url: string): boolean;
}

// Abstract base class with common functionality
export abstract class BaseMcpTransport implements IMcpTransport {
  protected async createClient(): Promise<Client> {
    return new Client(
      {
        name: 'mcp-tester-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  protected async safeListTools(client: Client): Promise<McpTool[]> {
    try {
      const result = await client.listTools();
      return result.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));
    } catch (error) {
      console.error('Error listing tools:', error);
      return [];
    }
  }

  protected async safeListResources(client: Client): Promise<McpResource[]> {
    try {
      const result = await client.listResources();
      return result.resources.map((resource: any) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      }));
    } catch (error) {
      console.error('Error listing resources:', error);
      return [];
    }
  }

  protected createConnectionError(error: unknown): Error {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return new Error('MCP server executable not found. Please check the server path.');
      } else if (error.message.includes('spawn')) {
        return new Error('Failed to start MCP server process. Please verify the command.');
      } else if (error.message.includes('ECONNREFUSED')) {
        return new Error('Connection refused. Please verify the server URL and ensure the server is running.');
      } else if (error.message.includes('fetch')) {
        return new Error('HTTP connection failed. Please check the URL and network connectivity.');
      } else {
        return new Error(`Connection failed: ${error.message}`);
      }
    }
    return new Error('Unknown connection error occurred.');
  }

  protected createToolCallError(error: unknown, toolName: string): Error {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return new Error('MCP server executable not found. Please check the server path.');
      } else if (error.message.includes('Tool not found')) {
        return new Error(`Tool "${toolName}" not found on the MCP server.`);
      } else if (error.message.includes('Invalid arguments')) {
        return new Error(`Invalid arguments provided for tool "${toolName}".`);
      } else {
        return new Error(`Tool call failed: ${error.message}`);
      }
    }
    return new Error(`Failed to call tool "${toolName}".`);
  }

  abstract connect(url: string, headers?: Record<string, string>): Promise<McpConnectionResult>;
  abstract callTool(url: string, toolName: string, toolArgs: any, headers?: Record<string, string>): Promise<McpToolCallResult>;
  abstract supportsProtocol(url: string): boolean;
} 