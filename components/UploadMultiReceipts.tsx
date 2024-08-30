"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Download, File, CheckCircle, XCircle } from "lucide-react";

interface ReceiptItem {
  quantity: string;
  description: string;
  unitPrice: string;
  amount: string;
}

interface ExtractedData {
  receiptDate: string;
  items: ReceiptItem[];
  total: string;
}

interface ProcessedReceipt {
  id: string;
  name: string;
  status: "pending" | "processing" | "completed" | "error";
  data: ExtractedData | null;
  error?: string;
}

export default function UploadMultiReceipts() {
  const [files, setFiles] = useState<File[]>([]);
  const [processedReceipts, setProcessedReceipts] = useState<
    ProcessedReceipt[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const onDrop = (acceptedFiles: File[]) => {
    const newProcessedReceipts = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      status: "pending" as const,
      data: null,
    }));

    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    setProcessedReceipts((prevReceipts) => [
      ...prevReceipts,
      ...newProcessedReceipts,
    ]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png"],
      "application/pdf": [".pdf"],
    },
    multiple: true,
  });

  const processReceipts = async () => {
    if (files.length === 0) {
      alert("Please upload at least one receipt first.");
      return;
    }

    setIsProcessing(true);
    setOverallProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const receipt = processedReceipts[i];

      setProcessedReceipts((prevReceipts) =>
        prevReceipts.map((r) =>
          r.id === receipt.id ? { ...r, status: "processing" } : r
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to process the receipt: ${response.statusText}`
          );
        }

        const data: ExtractedData = await response.json();

        setProcessedReceipts((prevReceipts) =>
          prevReceipts.map((r) =>
            r.id === receipt.id ? { ...r, status: "completed", data } : r
          )
        );
      } catch (error) {
        console.error("Error processing receipt:", error);
        setProcessedReceipts((prevReceipts) =>
          prevReceipts.map((r) =>
            r.id === receipt.id
              ? {
                  ...r,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : r
          )
        );
      }

      setOverallProgress(((i + 1) / files.length) * 100);
    }

    setIsProcessing(false);
  };

  const handleDownloadSpreadsheet = () => {
    // Implement spreadsheet download logic here
    console.log("Downloading spreadsheet...");
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-indigo-800 mb-2">
            Receipt to Spreadsheet
          </h1>
          <p className="text-xl text-indigo-600">
            Process multiple receipts in seconds
          </p>
        </header>

        <main>
          <Card className="bg-white shadow-xl rounded-xl overflow-hidden">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
                <div>
                  <div
                    {...getRootProps()}
                    className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors mb-6"
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                    <p className="text-2xl font-bold mb-2 text-indigo-700">
                      Upload receipts
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Drag & drop multiple receipts here, or click to select
                      files
                    </p>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Choose Files
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={processReceipts}
                      disabled={isProcessing || files.length === 0}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isProcessing ? "Processing..." : "Process All Receipts"}
                    </Button>
                    <Button
                      onClick={handleDownloadSpreadsheet}
                      disabled={processedReceipts.length === 0}
                      variant="outline"
                      className="w-full border-purple-600 text-purple-600 hover:bg-purple-100"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download Spreadsheet
                    </Button>
                  </div>

                  {isProcessing && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold mb-2">
                        Overall Progress
                      </p>
                      <Progress value={overallProgress} className="w-full" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4 text-indigo-800">
                    Uploaded Receipts
                  </h3>
                  <ScrollArea className="h-[400px] w-full rounded border p-4">
                    {processedReceipts.map((receipt) => (
                      <div
                        key={receipt.id}
                        className="flex items-center space-x-4 mb-4"
                      >
                        <File className="w-8 h-8 text-indigo-500" />
                        <div className="flex-grow">
                          <p className="font-semibold">{receipt.name}</p>
                          <p className="text-sm text-gray-500">
                            Status:{" "}
                            {receipt.status.charAt(0).toUpperCase() +
                              receipt.status.slice(1)}
                          </p>
                        </div>
                        {receipt.status === "completed" && (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        )}
                        {receipt.status === "error" && (
                          <XCircle className="w-6 h-6 text-red-500" />
                        )}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>

              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <TabsContent value="summary">
                  <Card>
                    <CardHeader>
                      <CardTitle>Processing Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Total Receipts: {processedReceipts.length}</p>
                      <p>
                        Processed:{" "}
                        {
                          processedReceipts.filter(
                            (r) => r.status === "completed"
                          ).length
                        }
                      </p>
                      <p>
                        Errors:{" "}
                        {
                          processedReceipts.filter((r) => r.status === "error")
                            .length
                        }
                      </p>
                      <p>
                        Pending:{" "}
                        {
                          processedReceipts.filter(
                            (r) => r.status === "pending"
                          ).length
                        }
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="details">
                  <Card>
                    <CardHeader>
                      <CardTitle>Processed Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Receipt</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedReceipts.map((receipt) => (
                            <TableRow key={receipt.id}>
                              <TableCell>{receipt.name}</TableCell>
                              <TableCell>
                                {receipt.data?.receiptDate || "-"}
                              </TableCell>
                              <TableCell>
                                {receipt.data?.total || "-"}
                              </TableCell>
                              <TableCell>{receipt.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
