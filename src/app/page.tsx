import { db } from '@/db';
import { mcpServers } from '@/db/schema';
import Link from 'next/link';
import { desc } from 'drizzle-orm';

export default async function HomePage() {
  const servers = await db.select().from(mcpServers).orderBy(desc(mcpServers.createdAt));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">MCP Servers Registry</h1>
        <Link 
          href="/register" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Register New MCP Server
        </Link>
      </div>

      {servers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No MCP servers registered</h3>
          <p className="text-gray-500 mb-4">Get started by registering your first MCP server</p>
          <Link 
            href="/register" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Register MCP Server
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => {
            const headers = server.headers as Record<string, string> | null;
            return (
              <div key={server.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{server.name}</h3>
                  <span className="text-xs text-gray-500">#{server.id}</span>
                </div>
                
                {server.description && (
                  <p className="text-gray-600 mb-4">{server.description}</p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">URL:</span>
                    <p className="text-sm text-gray-800 break-all">{server.url}</p>
                  </div>
                  
                  {headers && Object.keys(headers).length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Custom Headers:</span>
                      <p className="text-sm text-gray-800">
                        {Object.keys(headers).length} header(s) configured
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(server.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link 
                    href={`/mcp/${server.id}`}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors text-center"
                  >
                    Interact
                  </Link>
                  <Link 
                    href={`/edit/${server.id}`}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm transition-colors text-center"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
