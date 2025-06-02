'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface McpServer {
  id: number;
  name: string;
  description: string | null;
  url: string;
  transportType: 'stdio' | 'http' | 'sse';
  headers: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

interface McpTool {
  name: string;
  description?: string;
  inputSchema: any;
}

interface McpResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

interface ToolCall {
  toolName: string;
  arguments: any;
  result?: any;
  error?: string;
  timestamp: Date;
}

export default function McpPage() {
  const params = useParams();
  const router = useRouter();
  const [server, setServer] = useState<McpServer | null>(null);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [resources, setResources] = useState<McpResource[]>([]);
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null);
  const [toolArguments, setToolArguments] = useState<string>('{}');
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [headerOverrides, setHeaderOverrides] = useState<Record<string, string>>({});
  const [showHeaderOverrides, setShowHeaderOverrides] = useState(false);

  useEffect(() => {
    loadServer();
  }, [params.id]);

  useEffect(() => {
    // Initialize header overrides when server loads
    if (server && server.headers) {
      setHeaderOverrides(server.headers);
    }
  }, [server]);

  const loadServer = async () => {
    try {
      const response = await fetch(`/api/mcp-servers/${params.id}`);
      if (response.ok) {
        const serverData = await response.json();
        setServer(serverData);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading server:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const getEffectiveHeaders = () => {
    return { ...headerOverrides };
  };


  const updateHeaderOverride = (key: string, value: string) => {
    setHeaderOverrides(prev => ({ ...prev, [key]: value }));
  };

  const connectToMcp = async () => {
    if (!server) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const response = await fetch('/api/mcp-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: server.url,
          transportType: server.transportType,
          headers: getEffectiveHeaders(),
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setTools(data.tools || []);
        setResources(data.resources || []);
        setIsConnected(true);
      } else {
        setConnectionError(data.message || 'Failed to connect to MCP server');
      }
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsConnecting(false);
    }
  };

  const callTool = async () => {
    if (!selectedTool || !server) return;

    try {
      const args = JSON.parse(toolArguments);
      
      const response = await fetch('/api/mcp-call-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: server.url,
          transportType: server.transportType,
          headers: getEffectiveHeaders(),
          toolName: selectedTool.name,
          arguments: args,
        }),
      });

      const data = await response.json();
      
      const newCall: ToolCall = {
        toolName: selectedTool.name,
        arguments: args,
        timestamp: new Date(),
        ...(response.ok ? { result: data } : { error: data.message }),
      };

      setToolCalls(prev => [newCall, ...prev]);
    } catch (error) {
      const newCall: ToolCall = {
        toolName: selectedTool.name,
        arguments: toolArguments,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
      setToolCalls(prev => [newCall, ...prev]);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Server not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
            ← Back to Registry
          </Link>
          <h1 className="text-3xl font-bold text-black">{server.name}</h1>
        </div>
        <Link 
          href={`/edit/${server.id}`}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Edit Server
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Server Info & Connection */}
        <div>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-black">Server Information</h2>
            {server.description && (
              <p className="text-gray-600 mb-4">{server.description}</p>
            )}
            <div className="space-y-2">
              <div>
                <span className="font-medium text-black">URL:</span> <span className="text-black">{server.url}</span>
              </div>
              <div>
                <span className="font-medium text-black">Transport:</span> <span className="text-black">{
                  server.transportType === 'stdio' ? 'Local Process (stdio://)' :
                  server.transportType === 'http' ? 'Streamable HTTP' :
                  server.transportType === 'sse' ? 'Server-Sent Events' :
                  server.transportType
                }</span>
              </div>
              {server.headers && Object.keys(server.headers).length > 0 && (
                <div>
                  <span className="font-medium text-black">Headers:</span> <span className="text-black">{Object.keys(server.headers).length} configured</span>
                </div>
              )}
            </div>

            {/* Header Overrides Section */}
            <div className="mt-4">
              <button
                onClick={() => setShowHeaderOverrides(!showHeaderOverrides)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showHeaderOverrides ? '▼' : '▶'} Override Headers for This Session
              </button>
              
              {showHeaderOverrides && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg border">                  
                  {Object.keys(headerOverrides).length === 0 ? (
                    <p className="text-gray-500 text-sm">No headers configured</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(headerOverrides).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={key}
                            disabled
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 text-black"
                          />
                          <span className="text-gray-500">:</span>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateHeaderOverride(key, e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-black"
                            placeholder="Header value"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-600">
                    💡 Changes here only affect this session and won't modify the saved server configuration.
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              {!isConnected ? (
                <button
                  onClick={connectToMcp}
                  disabled={isConnecting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isConnecting ? 'Connecting...' : 'Connect to MCP Server'}
                </button>
              ) : (
                <div className="text-green-600 font-medium">✓ Connected</div>
              )}
              
              {connectionError && (
                <div className="mt-2 text-red-600 text-sm">{connectionError}</div>
              )}
            </div>
          </div>

          {/* Tools List */}
          {isConnected && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 text-black">Available Tools</h2>
              {tools.length === 0 ? (
                <p className="text-gray-500">No tools available</p>
              ) : (
                <div className="space-y-2">
                  {tools.map((tool) => (
                    <div
                      key={tool.name}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedTool?.name === tool.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTool(tool)}
                    >
                      <div className="font-medium text-black">{tool.name}</div>
                      {tool.description && (
                        <div className="text-sm text-gray-600">{tool.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tool Testing */}
        <div>
          {selectedTool && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-black">Test Tool: {selectedTool.name}</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arguments (JSON)
                </label>
                <textarea
                  value={toolArguments}
                  onChange={(e) => setToolArguments(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  rows={6}
                  placeholder='{"param": "value"}'
                />
              </div>
              
              <button
                onClick={callTool}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Call Tool
              </button>
            </div>
          )}

          {/* Tool Call History */}
          {toolCalls.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 text-black">Call History</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {toolCalls.map((call, index) => (
                  <div key={index} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-black">{call.toolName}</span>
                      <span className="text-xs text-gray-500">
                        {call.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="text-sm mb-2">
                      <strong className="text-black">Args:</strong>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto text-black">
                        {JSON.stringify(call.arguments, null, 2)}
                      </pre>
                    </div>
                    
                    {call.result && (
                      <div className="text-sm">
                        <strong className="text-green-600">Result:</strong>
                        <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto text-black">
                          {JSON.stringify(call.result, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {call.error && (
                      <div className="text-sm">
                        <strong className="text-red-600">Error:</strong>
                        <pre className="bg-red-50 p-2 rounded text-xs overflow-x-auto text-black">
                          {call.error}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 