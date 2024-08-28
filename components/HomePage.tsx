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
import { QuestionMarkCircledIcon, PersonIcon } from "@radix-ui/react-icons";
import LoadingSpinner from "./LoadingSpinner";

interface ExtractedData {
  date: string;
  merchant: string;
}

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
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
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process the receipt");
      }

      const data: ExtractedData[] = await response.json();
      setExtractedData(data);
      setSuccess(true);
    } catch (error) {
      console.error("Error converting receipt:", error);
      setError("Failed to process the receipt. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSpreadsheet = async () => {
    try {
      const response = await fetch("/api/generate-spreadsheet");
      if (!response.ok) {
        throw new Error("Failed to generate spreadsheet");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "receipts.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading spreadsheet:", error);
      setError("Failed to download spreadsheet. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      <header className="flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold">Receipt to Spreadsheet</h1>
        <nav className="flex items-center">
          <a href="#" className="mr-4 hidden sm:inline">
            Home
          </a>
          <a href="#" className="mr-4 hidden sm:inline">
            Templates
          </a>
          <a href="#" className="mr-4 hidden sm:inline">
            Use cases
          </a>
          <QuestionMarkCircledIcon className="w-6 h-6 mr-4 cursor-pointer" />
          <PersonIcon className="w-6 h-6 cursor-pointer" />
        </nav>
      </header>

      <main className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">Receipt to Spreadsheet</h2>
            <p className="mb-4">
              Convert your receipts to structured data in seconds
            </p>

            <div
              {...getRootProps()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer"
            >
              <input {...getInputProps()} />
              <p className="text-2xl font-bold mb-2">Upload a receipt</p>
              <p className="text-sm text-gray-500 mb-4">
                We accept images (JPG, PNG) and PDFs. Max 4MB.
              </p>
              <Button>Upload receipt</Button>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold mb-2">Or paste a receipt</h3>
              <Input placeholder="Paste your receipt here" className="mb-4" />
              <Button onClick={handleConvert} disabled={isProcessing}>
                {isProcessing ? "Converting..." : "Convert"}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                No credit card required
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mt-4">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Receipt processed successfully!
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Your receipt</h3>
            <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
              {file ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Uploaded receipt"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <p className="text-gray-500">No receipt uploaded yet</p>
              )}
            </div>

            <h3 className="text-xl font-bold mt-8 mb-4">
              Converted to spreadsheet
            </h3>
            {isProcessing ? (
              <LoadingSpinner />
            ) : extractedData.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Merchant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.merchant}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button onClick={handleDownloadSpreadsheet} className="mt-4">
                  Download Spreadsheet
                </Button>
              </>
            ) : (
              <p className="text-gray-500">No data extracted yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
