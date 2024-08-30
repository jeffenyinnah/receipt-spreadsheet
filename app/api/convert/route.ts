import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { MongoClient, ObjectId } from 'mongodb';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Create a temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `receipt-${Date.now()}.png`);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write the file to the temporary directory
    await writeFile(tempFilePath, buffer);

    // Perform OCR
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(tempFilePath);
    await worker.terminate();

    // Remove the temporary file
    await unlink(tempFilePath);

    // Process extracted text (simplified example)
    const lines = text.split('\n');
    const extractedData = lines.map(line => {
      const [date, description, amount] = line.split(',');
      return { date: date?.trim(), description: description?.trim(), amount: amount?.trim() };
    });
    console.log(extractedData);

    // Save to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    const client = await MongoClient.connect(mongoUri);
    const db = client.db('receipts');
    const result = await db.collection('processed_receipts').insertOne({
      data: extractedData,
      createdAt: new Date()
    });
    await client.close();

    return NextResponse.json({ extractedData }, { status: 200 });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json({ error: 'Error processing image' }, { status: 500 });
  }
}