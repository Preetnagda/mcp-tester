import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { BaseMcpTransport, McpConnectionResult, McpToolCallResult } from '@/lib/transports/base-transport';

// SSE transport implementation (legacy)
export class SseMcpTransport extends BaseMcpTransport {
  supportsProtocol(url: string): boolean {
    return url.startsWith('https://') || url.startsWith('http://');
  }

  async connect(url: string, headers: Record<string, string> = {}): Promise<McpConnectionResult> {
    try {
      const transport = new SSEClientTransport(new URL(url), {
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
    } catch (error) {
      throw this.createConnectionError(error);
    }
  }

  async callTool(url: string, toolName: string, toolArgs: any, headers: Record<string, string> = {}): Promise<McpToolCallResult> {
    try {
      const transport = new SSEClientTransport(new URL(url), {
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
    } catch (error) {
      throw this.createToolCallError(error, toolName);
    }
  }
} 