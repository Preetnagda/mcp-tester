'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Header {
  key: string;
  value: string;
}

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

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    transportType: 'http' as 'stdio' | 'http' | 'sse',
  });
  const [headers, setHeaders] = useState<Header[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServer();
  }, [params.id]);

  const loadServer = async () => {
    try {
      const response = await fetch(`/api/mcp-servers/${params.id}`);
      if (response.ok) {
        const server: McpServer = await response.json();
        setFormData({
          name: server.name,
          description: server.description || '',
          url: server.url,
          transportType: server.transportType || 'http',
        });
        
        // Convert headers object to array format
        if (server.headers) {
          const headersArray = Object.entries(server.headers).map(([key, value]) => ({
            key,
            value,
          }));
          setHeaders(headersArray);
        }
      } else {
        setError('Server not found');
      }
    } catch (error) {
      setError('Failed to load server data');
    } finally {
      setIsLoading(false);
    }
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updatedHeaders = [...headers];
    updatedHeaders[index][field] = value;
    setHeaders(updatedHeaders);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const headersObject = headers.reduce((acc, header) => {
        if (header.key && header.value) {
          acc[header.key] = header.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const response = await fetch(`/api/mcp-servers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          headers: headersObject,
        }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">Loading server data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Registry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
          ← Back to Registry
        </Link>
        <h1 className="text-3xl font-bold">Edit MCP Server</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Server Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="My MCP Server"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe what this MCP server does..."
          />
        </div>

        <div>
          <label htmlFor="transportType" className="block text-sm font-medium text-gray-700 mb-2">
            Transport Type *
          </label>
          <select
            id="transportType"
            required
            value={formData.transportType}
            onChange={(e) => setFormData(prev => ({ ...prev, transportType: e.target.value as 'stdio' | 'http' | 'sse' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="http">HTTP/HTTPS (Streamable HTTP)</option>
            <option value="sse">HTTP/HTTPS (Server-Sent Events)</option>
            <option value="stdio">Local Process (stdio://)</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {formData.transportType === 'stdio' && 'For local MCP servers that run as processes (e.g., stdio://node server.js)'}
            {formData.transportType === 'http' && 'For remote MCP servers using modern Streamable HTTP transport'}
            {formData.transportType === 'sse' && 'For remote MCP servers using legacy Server-Sent Events transport'}
          </p>
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Server URL *
          </label>
          <input
            type="text"
            id="url"
            required
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={
              formData.transportType === 'stdio' 
                ? 'stdio://node /path/to/server.js' 
                : 'https://example.com/mcp'
            }
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.transportType === 'stdio' && 'Use stdio:// protocol with command and arguments'}
            {(formData.transportType === 'http' || formData.transportType === 'sse') && 'Use https:// or http:// URL to your MCP server endpoint'}
          </p>
        </div>

        {(formData.transportType === 'http' || formData.transportType === 'sse') && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Custom Headers
              </label>
              <button
                type="button"
                onClick={addHeader}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Add Header
              </button>
            </div>
            
            {headers.map((header, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Header name"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Header value"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeHeader(index)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Updating...' : 'Update Server'}
          </button>
          
          <Link
            href="/"
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
} 