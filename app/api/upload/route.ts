import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { MongoClient } from 'mongodb';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

interface ExtractedData {
  receiptDate: string;
  items: {
    quantity: string;
    description: string;
    unitPrice: string;
    amount: string;
  }[];
  total: string;
}

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

    // Process extracted text
    const extractedData: ExtractedData = {
      receiptDate: '',
      items: [],
      total: ''
    };

    const lines = text.split('\n');
    let inItemsSection = false;

    console.log("Raw OCR text:", text); // Log the raw OCR text

    for (const line of lines) {
      // Extract receipt date
      const dateMatch = line.match(/Receipt Date\s*:?\s*(\d{1,2}\/\d{2}\/\d{4})/i);
      if (dateMatch) {
        extractedData.receiptDate = dateMatch[1];
        console.log("Extracted date:", extractedData.receiptDate);
      }

      // Check for start of items section (more lenient)
      if (line.match(/DESCRIPTION.*UNIT PRICE.*AMOUNT/i)) {
        inItemsSection = true;
        console.log("Entered items section");
        continue;
      }

      // Extract items
      if (inItemsSection) {
        console.log("Processing line in items section:", line); // Log each line in the items section
        // More flexible regex to match imperfect OCR output
        const itemMatch = line.match(/(\d+)\s*\|?\s*(.+?)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/);
        if (itemMatch) {
          const item = {
            quantity: itemMatch[1],
            description: itemMatch[2].trim().replace(/\|/g, ''),
            unitPrice: itemMatch[3],
            amount: itemMatch[4]
          };
          extractedData.items.push(item);
          console.log("Extracted item:", item); // Log each extracted item
        } else {
          console.log("Line did not match item pattern:", line); // Log lines that don't match the pattern
          // Fallback item extraction
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 4) {
            const item = {
              quantity: parts[0],
              description: parts.slice(1, -2).join(' ').replace(/\|/g, ''),
              unitPrice: parts[parts.length - 2],
              amount: parts[parts.length - 1]
            };
            extractedData.items.push(item);
            console.log("Extracted item (fallback method):", item);
          }
        }
      }

      // Extract total
      const totalMatch = line.match(/TOTAL\s*\$?(\d+\.\d{2})/i);
      if (totalMatch) {
        extractedData.total = totalMatch[1];
        inItemsSection = false; // End of items section
        console.log("Extracted total:", extractedData.total);
      }
    }

    // Clean up descriptions (remove pipe characters and extra spaces)
    extractedData.items = extractedData.items.map(item => ({
      ...item,
      description: item.description.replace(/\|/g, '').trim()
    }));

    console.log("Final extracted data:", JSON.stringify(extractedData, null, 2));

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

    return NextResponse.json(extractedData, { status: 200 });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json({ error: 'Error processing image' }, { status: 500 });
  }
}