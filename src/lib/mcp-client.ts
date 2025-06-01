import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

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

export class McpConnectionManager {
  private static async createClient(): Promise<Client> {
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

  static async connect(url: string, headers: Record<string, string> = {}): Promise<McpConnectionResult> {
    try {
      if (url.startsWith('stdio://')) {
        return await this.connectStdio(url);
      } else if (url.startsWith('https://') || url.startsWith('http://')) {
        return await this.connectHttp(url, headers);
      } else {
        // Fallback to mock data for unsupported protocols
        return this.getMockData();
      }
    } catch (error) {
      console.error('MCP connection error:', error);
      throw this.createConnectionError(error);
    }
  }

  private static async connectStdio(url: string): Promise<McpConnectionResult> {
    const command = url.replace('stdio://', '');
    const parts = command.split(' ');
    const executable = parts[0];
    const args = parts.slice(1);

    const transport = new StdioClientTransport({
      command: executable,
      args: args,
    });

    const client = await this.createClient();
    await client.connect(transport);

    try {
      const [toolsResult, resourcesResult] = await Promise.all([
        this.safeListTools(client),
        this.safeListResources(client),
      ]);

      return {
        tools: toolsResult,
        resources: resourcesResult,
        capabilities: {
          tools: { listChanged: true },
          resources: { subscribe: true, listChanged: true },
        },
      };
    } finally {
      await client.close();
    }
  }

  private static async connectHttp(url: string, headers: Record<string, string> = {}): Promise<McpConnectionResult> {
    // For HTTP/HTTPS, we'll use Server-Sent Events (SSE) transport
    const transport = new StreamableHTTPClientTransport(new URL(url), {
      requestInit: {
        headers
      }
    });

    const client = await this.createClient();
    await client.connect(transport);

    try {
      const [toolsResult, resourcesResult] = await Promise.all([
        this.safeListTools(client),
        this.safeListResources(client),
      ]);

      return {
        tools: toolsResult,
        resources: resourcesResult,
        capabilities: {
          tools: { listChanged: true },
          resources: { subscribe: true, listChanged: true },
        },
      };
    } finally {
      await client.close();
    }
  }

  private static async safeListTools(client: Client): Promise<McpTool[]> {
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

  private static async safeListResources(client: Client): Promise<McpResource[]> {
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

  static async callTool(
    url: string, 
    toolName: string, 
    toolArgs: any = {}, 
    headers: Record<string, string> = {}
  ): Promise<McpToolCallResult> {
    try {
      if (url.startsWith('stdio://')) {
        return await this.callToolStdio(url, toolName, toolArgs);
      } else if (url.startsWith('https://') || url.startsWith('http://')) {
        return await this.callToolHttp(url, toolName, toolArgs, headers);
      } else {
        // Fallback to mock responses
        return this.getMockToolResponse(toolName, toolArgs);
      }
    } catch (error) {
      console.error('MCP tool call error:', error);
      throw this.createToolCallError(error, toolName);
    }
  }

  private static async callToolStdio(url: string, toolName: string, toolArgs: any): Promise<McpToolCallResult> {
    const command = url.replace('stdio://', '');
    const parts = command.split(' ');
    const executable = parts[0];
    const args = parts.slice(1);

    const transport = new StdioClientTransport({
      command: executable,
      args: args,
    });

    const client = await this.createClient();
    await client.connect(transport);

    try {
      const result = await client.callTool({
        name: toolName,
        arguments: toolArgs,
      });

      return result as McpToolCallResult;
    } finally {
      await client.close();
    }
  }

  private static async callToolHttp(
    url: string, 
    toolName: string, 
    toolArgs: any, 
    headers: Record<string, string>
  ): Promise<McpToolCallResult> {
    const transport = new StreamableHTTPClientTransport(new URL(url), {
      requestInit: {
        headers
      }
    });

    const client = await this.createClient();
    await client.connect(transport);

    try {
      const result = await client.callTool({
        name: toolName,
        arguments: toolArgs,
      });

      return result as McpToolCallResult;
    } finally {
      await client.close();
    }
  }

  private static getMockData(): McpConnectionResult {
    return {
      tools: [
        {
          name: 'get_weather',
          description: 'Get current weather for a location',
          inputSchema: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'City name or coordinates'
              }
            },
            required: ['location']
          }
        },
        {
          name: 'search_web',
          description: 'Search the web for information',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query'
              },
              limit: {
                type: 'number',
                description: 'Number of results to return',
                default: 10
              }
            },
            required: ['query']
          }
        }
      ],
      resources: [
        {
          uri: 'file:///data/customers.json',
          name: 'Customer Database',
          description: 'Customer information and records',
          mimeType: 'application/json'
        }
      ],
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: true, listChanged: true }
      }
    };
  }

  private static getMockToolResponse(toolName: string, toolArgs: any): McpToolCallResult {
    switch (toolName) {
      case 'get_weather':
        return {
          content: [
            {
              type: 'text',
              text: `Weather in ${toolArgs.location || 'Unknown Location'}: 72°F, Sunny with light clouds. Wind: 5 mph from the west.`
            }
          ]
        };
        
      case 'search_web':
        return {
          content: [
            {
              type: 'text',
              text: `Search results for "${toolArgs.query}":\n\n1. Example.com - Information about ${toolArgs.query}\n2. Wikipedia.org - ${toolArgs.query} overview\n3. News.com - Latest news about ${toolArgs.query}`
            }
          ]
        };
        
      default:
        return {
          content: [
            {
              type: 'text',
              text: `Tool "${toolName}" executed successfully with arguments: ${JSON.stringify(toolArgs)}`
            }
          ]
        };
    }
  }

  private static createConnectionError(error: unknown): Error {
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

  private static createToolCallError(error: unknown, toolName: string): Error {
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
} 