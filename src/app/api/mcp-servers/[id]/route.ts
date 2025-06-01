import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mcpServers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; 
    const idNumber = parseInt(id);
    
    if (isNaN(idNumber)) {
      return NextResponse.json(
        { message: 'Invalid server ID' },
        { status: 400 }
      );
    }

    const server = await db
      .select()
      .from(mcpServers)
      .where(eq(mcpServers.id, idNumber))
      .limit(1);

    if (server.length === 0) {
      return NextResponse.json(
        { message: 'Server not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(server[0]);
  } catch (error) {
    console.error('Error fetching MCP server:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Invalid server ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, url, headers } = body;

    if (!name || !url) {
      return NextResponse.json(
        { message: 'Name and URL are required' },
        { status: 400 }
      );
    }

    const updatedServer = await db
      .update(mcpServers)
      .set({
        name,
        description: description || null,
        url,
        headers: headers || {},
        updatedAt: new Date(),
      })
      .where(eq(mcpServers.id, id))
      .returning();

    if (updatedServer.length === 0) {
      return NextResponse.json(
        { message: 'Server not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedServer[0]);
  } catch (error) {
    console.error('Error updating MCP server:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 