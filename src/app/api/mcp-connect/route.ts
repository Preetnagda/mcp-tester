import { NextRequest, NextResponse } from 'next/server';
import { McpConnectionManager } from '@/lib/mcp-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, headers } = body;

    if (!url) {
      return NextResponse.json(
        { message: 'Server URL is required' },
        { status: 400 }
      );
    }

    const result = await McpConnectionManager.connect(url, headers || {});
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in MCP connect route:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 