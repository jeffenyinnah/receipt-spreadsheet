"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, User, Upload, Download } from "lucide-react";
import { toast } from "./ui/use-toast";
import { ToastAction } from "./ui/toast";

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

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setError(null);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png"],
      "application/pdf": [".pdf"],
    },
    maxSize: 4 * 1024 * 1024, // 4MB
  });

  const handleConvert = async () => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
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
      setExtractedData(data);
      setSuccess(true);
    } catch (error) {
      console.error("Error converting receipt:", error);
      setError(
        `Failed to process the receipt: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSpreadsheet = () => {
    // Implement spreadsheet download logic here
    if (!extractedData) {
      setError("No data extracted yet.");
      toast({
        title: "Error",
        variant: "destructive",
        description: "No data extracted yet.",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
        className: "bg-red-500 text-white",
      });
      return;
    }
    try {
      const spreadsheetData = `
      Date: ${extractedData.receiptDate}
      Total: ${extractedData.total}
      Items:
      ${extractedData.items
        .map(
          (item) => `
        Quantity: ${item.quantity},
        Description: ${item.description},
        Unit Price: ${item.unitPrice},
        Amount: ${item.amount}
      `
        )
        .join("\n")}
    `;

      const blob = new Blob([spreadsheetData], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "receipt_data.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Spreadsheet downloaded successfully!",
        variant: "default",
        description: "Your spreadsheet has been downloaded successfully!",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Error downloading spreadsheet:", error);
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to download spreadsheet.",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
        className: "bg-red-500 text-white",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        <main className="mt-12">
          <Card className="bg-white shadow-xl rounded-xl overflow-hidden">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-4xl font-bold mb-4 text-indigo-800">
                    Convert Receipts in Seconds
                  </h2>
                  <p className="mb-8 text-gray-600">
                    Transform your receipts into structured data effortlessly
                  </p>

                  <div
                    {...getRootProps()}
                    className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                    <p className="text-2xl font-bold mb-2 text-indigo-700">
                      Upload a receipt
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      We accept images (JPG, PNG) and PDFs. Max 4MB.
                    </p>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Choose File
                    </Button>
                  </div>

                  <div className="mt-8 space-x-4">
                    <Button
                      onClick={handleConvert}
                      disabled={isProcessing}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isProcessing ? "Converting..." : "Convert Receipt"}
                    </Button>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="mt-4 bg-green-100 border-green-400 text-green-700">
                      <AlertTitle>Success</AlertTitle>
                      <AlertDescription>
                        Receipt processed successfully!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div>
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview">Receipt Preview</TabsTrigger>
                      <TabsTrigger value="data">Extracted Data</TabsTrigger>
                    </TabsList>
                    <TabsContent value="preview">
                      <Card>
                        <CardHeader>
                          <CardTitle>Your Receipt</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                            {file ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt="Uploaded receipt"
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <p className="text-gray-500">
                                No receipt uploaded yet
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="data">
                      <Card>
                        <CardHeader>
                          <CardTitle>Extracted Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {extractedData ? (
                            <div>
                              <div className="flex justify-between mb-4">
                                <p>
                                  <strong>Date:</strong>{" "}
                                  {extractedData.receiptDate}
                                </p>
                                <p>
                                  <strong>Total:</strong> ${extractedData.total}
                                </p>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Unit Price</TableHead>
                                    <TableHead>Amount</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {extractedData.items.map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>{item.description}</TableCell>
                                      <TableCell>${item.unitPrice}</TableCell>
                                      <TableCell>${item.amount}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-gray-500">
                              No data extracted yet
                            </p>
                          )}
                        </CardContent>
                        <CardFooter>
                          <Button
                            onClick={handleDownloadSpreadsheet}
                            disabled={!extractedData}
                            variant="outline"
                            className="border-purple-600 text-purple-600 hover:bg-purple-100"
                          >
                            <Download className="w-4 h-4 mr-2" /> Download
                            Spreadsheet
                          </Button>
                        </CardFooter>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
