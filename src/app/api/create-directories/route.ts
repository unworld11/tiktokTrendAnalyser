import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Create necessary directories
const dirs = [
  path.join(process.cwd(), 'public', 'transcriptions'),
  path.join(process.cwd(), 'public', 'data'),
  path.join(process.cwd(), 'public', 'audio')
];

// Create directories on module load
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
});

export async function GET() {
  try {
    // Return info about created directories
    const dirStatus = dirs.map(dir => ({
      path: dir.replace(process.cwd(), ''),
      exists: fs.existsSync(dir)
    }));
    
    return NextResponse.json({
      success: true,
      directories: dirStatus
    });
  } catch (error: unknown) {
    console.error('Error in directory creation:', error);
    return NextResponse.json(
      { error: 'Failed to verify directories', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 