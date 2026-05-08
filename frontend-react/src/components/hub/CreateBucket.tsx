"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  FileSpreadsheet,
  CheckCircle,
  BarChart3,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CreateBucketProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateBucket({
  open,
  onOpenChange,
  onSuccess,
}: CreateBucketProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createBucketMutation = useMutation({
    mutationFn: (data: { file: File; name: string; description: string }) =>
      apiClient.createBucket(
        data.file,
        data.name,
        data.description,
        setUploadProgress,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
      toast({
        title: "Success",
        description: "Bucket created successfully",
        duration: 2000,
      });
      resetForm();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bucket",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  const resetForm = () => {
    setSelectedFile(null);
    setName("");
    setDescription("");
    setUploadProgress(0);
  };

  const handleFileSelect = (file: File) => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (
      validTypes.includes(file.type) ||
      file.name.endsWith(".csv") ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls")
    ) {
      setSelectedFile(file);
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, ""));
      }
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV or Excel file",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile && name) {
      createBucketMutation.mutate({ file: selectedFile, name, description });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[95vw] h-[85vh] p-0 gap-0 bg-white/80 dark:bg-[#0d1117]/80 backdrop-blur-2xl dark:border-[#3d4555] overflow-hidden flex flex-col rounded-3xl shadow-2xl">
        {/* Header - Fixed */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-[#30363d] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/10 dark:bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-200 dark:border-blue-800 shadow-sm">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Create Data Bucket
                  <Badge className="bg-blue-600 text-white uppercase tracking-tighter border-0 h-4 px-1.5 flex items-center justify-center text-[9px]">
                    Analytica
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium italic">
                  Upload datasets for advanced AI-driven analysis and insights
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <form
            id="create-bucket-form"
            onSubmit={handleSubmit}
            className="p-6 space-y-6"
          >
            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70">
                Source Data File
              </Label>
              {!selectedFile ? (
                <div
                  className={cn(
                    "mt-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 group",
                    isDragOver
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-[#30363d] hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-[#0d1117]",
                  )}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                  }}
                  onClick={() =>
                    document.getElementById("bucket-file-input")?.click()
                  }
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                      Drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Supports CSV, XLSX, XLS (Max 50MB)
                    </p>
                  </div>
                  <input
                    id="bucket-file-input"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  />
                </div>
              ) : (
                <div className="mt-2 p-4 border border-blue-200 dark:border-blue-900/30 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 relative overflow-hidden group">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase tracking-tighter">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    {!createBucketMutation.isPending && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CheckCircle className="h-16 w-16 text-blue-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70"
              >
                Bucket Identifier
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Regional Sales Dataset Q4"
                disabled={createBucketMutation.isPending}
                className="h-10 text-sm bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-white dark:border-[#30363d] dark:placeholder:text-gray-600 rounded-lg transition-all duration-300"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70"
              >
                Analytical Context
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide metadata to help Analytica's engine categorize this data accurately..."
                rows={3}
                disabled={createBucketMutation.isPending}
                className="min-h-[100px] text-sm bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-none dark:bg-[#0d1117] dark:text-white dark:border-[#30363d] dark:placeholder:text-gray-600 rounded-lg transition-all duration-300"
              />
            </div>

            {/* Upload Progress */}
            {createBucketMutation.isPending && (
              <div className="space-y-6 p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <div>
                      <span className="font-bold text-blue-900 dark:text-blue-300 block">
                        Deploying Dataset
                      </span>
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                        {uploadProgress < 30
                          ? "Uploading to secure node..."
                          : uploadProgress < 60
                            ? "Analyzing structural metadata..."
                            : uploadProgress < 90
                              ? "Generating statistics..."
                              : "Finalizing deployment..."}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-blue-600">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress
                  value={uploadProgress}
                  className="h-2.5 bg-blue-200/50 overflow-hidden"
                />
              </div>
            )}

            {/* Info Section */}
            <div className="p-6 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 dark:from-blue-900/10 dark:to-transparent rounded-3xl border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="font-black text-xs uppercase tracking-widest text-blue-700 dark:text-blue-300">
                  Analytica Engine Core
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-bold tracking-tight uppercase">
                    Automatic Schema Detection
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-bold tracking-tight uppercase">
                    Statistical Processing
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-bold tracking-tight uppercase">
                    Data Quality Grading
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-bold tracking-tight uppercase">
                    Predictive Insight Generation
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t border-gray-100 dark:border-[#30363d] shrink-0 bg-slate-50/50 dark:bg-[#161b22]/50 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={createBucketMutation.isPending}
              className="text-gray-500 text-sm font-bold hover:bg-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-white h-10 px-4"
            >
              Cancel
            </Button>
            <Button
              form="create-bucket-form"
              type="submit"
              disabled={
                !selectedFile || !name || createBucketMutation.isPending
              }
              className={cn(
                "h-10 px-6 min-w-[160px] font-black uppercase text-[11px] tracking-widest rounded-xl transition-all duration-500 active:scale-95 shadow-md",
                !selectedFile || !name || createBucketMutation.isPending
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:shadow-blue-500/30 hover:translate-y-[-1px]",
              )}
            >
              {createBucketMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deploying Dataset...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Initialize Bucket</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
