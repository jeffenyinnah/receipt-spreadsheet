import { NextRequest, NextResponse } from 'next/server';
import formidable, { File } from 'formidable';
import fs from 'fs';
import { createWorker } from 'tesseract.js';
import { MongoClient } from 'mongodb';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const form = new formidable.IncomingForm({
    keepExtensions: true, // Keep file extensions
    uploadDir: './public/uploads', // Directory to save uploaded files
  });

  return new Promise((resolve, reject) => {
    form.parse(req as any, async (err, fields, files) => {
      if (err) {
        return resolve(
          NextResponse.json({ message: 'Error parsing form data' }, { status: 500 })
        );
      }

      const file = files.file as formidable.File | undefined;
      if (!file) {
        return resolve(
          NextResponse.json({ message: 'No file uploaded' }, { status: 400 })
        );
      }

      const filePath = file.filepath;

      try {
        // Perform OCR
        const worker = await createWorker('eng');
        const { data: { text } } = await worker.recognize(filePath);
        await worker.terminate();

        // Process extracted text
        const lines = text.split('\n');
        const extractedData = lines.map(line => {
          const [date, merchant] = line.split(',');
          return { date: date?.trim() || '', merchant: merchant?.trim() || '' };
        });

        // Save to MongoDB
        const client = await MongoClient.connect(process.env.MONGODB_URI as string);
        const db = client.db('receipts');
        await db.collection('extracted_data').insertMany(extractedData);
        await client.close();

        resolve(NextResponse.json(extractedData, { status: 200 }));
      } catch (error) {
        console.error('Error processing image:', error);
        resolve(NextResponse.json({ message: 'Error processing image' }, { status: 500 }));
      } finally {
        // Clean up the temporary file
        fs.unlinkSync(filePath);
      }
    });
  });
}
