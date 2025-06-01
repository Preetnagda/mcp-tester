// Export types for backward compatibility
export type {
  McpTool,
  McpResource,
  McpConnectionResult,
  McpToolCallResult,
  IMcpTransport
} from './transports/index.js';

// Import transport implementations
import {
  IMcpTransport,
  McpConnectionResult,
  McpToolCallResult,
  StdioMcpTransport,
  HttpMcpTransport
} from './transports/index.js';

// Connection manager that delegates to appropriate transport implementations
export class McpConnectionManager {
  private static transports: IMcpTransport[] = [
    new StdioMcpTransport(),
    new HttpMcpTransport(),
  ];

  private static getTransport(url: string): IMcpTransport {
    const transport = this.transports.find(t => t.supportsProtocol(url));
    if (!transport) {
      throw new Error(`Unsupported protocol for URL: ${url}`);
    }
    return transport;
  }

  static async connect(url: string, headers: Record<string, string> = {}): Promise<McpConnectionResult> {
    try {
      const transport = this.getTransport(url);
      return await transport.connect(url, headers);
    } catch (error) {
      console.error('MCP connection error:', error);
      throw error;
    }
  }

  static async callTool(
    url: string, 
    toolName: string, 
    toolArgs: any = {}, 
    headers: Record<string, string> = {}
  ): Promise<McpToolCallResult> {
    try {
      const transport = this.getTransport(url);
      return await transport.callTool(url, toolName, toolArgs, headers);
    } catch (error) {
      console.error('MCP tool call error:', error);
      throw error;
    }
  }

  // Method to register new transport implementations
  static registerTransport(transport: IMcpTransport): void {
    this.transports.push(transport);
  }

  // Method to get available transports
  static getAvailableTransports(): IMcpTransport[] {
    return [...this.transports];
  }
} 