// Export types for backward compatibility
export type {
  McpTool,
  McpResource,
  McpConnectionResult,
  McpToolCallResult,
  IMcpTransport
} from '@/lib/transports/index';

// Import transport implementations
import {
  IMcpTransport,
  McpConnectionResult,
  McpToolCallResult,
  StdioMcpTransport,
  HttpMcpTransport,
  SseMcpTransport
} from '@/lib/transports/index';

export type TransportType = 'stdio' | 'http' | 'sse';

// Connection manager that delegates to appropriate transport implementations
export class McpConnectionManager {
  private static transports: Map<TransportType, IMcpTransport> = new Map([
    ['stdio', new StdioMcpTransport()],
    ['http', new HttpMcpTransport()],
    ['sse', new SseMcpTransport()],
  ]);

  private static getTransport(transportType: TransportType): IMcpTransport {
    const transport = this.transports.get(transportType);
    if (!transport) {
      throw new Error(`Unsupported transport type: ${transportType}`);
    }
    return transport;
  }

  static async connect(
    url: string, 
    transportType: TransportType, 
    headers: Record<string, string> = {}
  ): Promise<McpConnectionResult> {
    try {
      const transport = this.getTransport(transportType);
      return await transport.connect(url, headers);
    } catch (error) {
      console.error('MCP connection error:', error);
      throw error;
    }
  }

  static async callTool(
    url: string, 
    transportType: TransportType,
    toolName: string, 
    toolArgs: any = {}, 
    headers: Record<string, string> = {}
  ): Promise<McpToolCallResult> {
    try {
      const transport = this.getTransport(transportType);
      return await transport.callTool(url, toolName, toolArgs, headers);
    } catch (error) {
      console.error('MCP tool call error:', error);
      throw error;
    }
  }

  // Method to register new transport implementations
  static registerTransport(transportType: TransportType, transport: IMcpTransport): void {
    this.transports.set(transportType, transport);
  }

  // Method to get available transports
  static getAvailableTransports(): Map<TransportType, IMcpTransport> {
    return new Map(this.transports);
  }

  // Legacy method for backward compatibility - tries to detect transport from URL
  static async connectLegacy(url: string, headers: Record<string, string> = {}): Promise<McpConnectionResult> {
    let transportType: TransportType = 'http';
    
    if (url.startsWith('stdio://')) {
      transportType = 'stdio';
    } else if (url.startsWith('https://') || url.startsWith('http://')) {
      transportType = 'http';
    }
    
    return this.connect(url, transportType, headers);
  }

  // Legacy method for backward compatibility
  static async callToolLegacy(
    url: string, 
    toolName: string, 
    toolArgs: any = {}, 
    headers: Record<string, string> = {}
  ): Promise<McpToolCallResult> {
    let transportType: TransportType = 'http';
    
    if (url.startsWith('stdio://')) {
      transportType = 'stdio';
    } else if (url.startsWith('https://') || url.startsWith('http://')) {
      transportType = 'http';
    }
    
    return this.callTool(url, transportType, toolName, toolArgs, headers);
  }
} 