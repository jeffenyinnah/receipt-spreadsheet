import { NextApiRequest, NextApiResponse } from 'next';
import * as XLSX from 'xlsx';
import { MongoClient } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Fetch data from MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI as string);
    const db = client.db('receipts');
    const data = await db.collection('extracted_data').find().toArray();
    await client.close();

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Receipts');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=receipts.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Send the buffer
    res.send(buf);
  } catch (error) {
    console.error('Error generating spreadsheet:', error);
    res.status(500).json({ message: 'Error generating spreadsheet' });
  }
}