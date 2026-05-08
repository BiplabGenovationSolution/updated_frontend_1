"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Upload, X, FileSpreadsheet, CheckCircle, BarChart3, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function CreateBucketPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const createBucketMutation = useMutation({
    mutationFn: (data: { file: File; name: string; description: string }) =>
      apiClient.createBucket(data.file, data.name, data.description, setUploadProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
      toast({ title: "Success", description: "Bucket created successfully", duration: 2000 });
      navigate("/hub?tab=buckets");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create bucket", variant: "destructive", duration: 2000 });
    },
  });

  const handleFileSelect = (file: File) => {
    const validTypes = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if (validTypes.includes(file.type) || file.name.endsWith(".csv") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      setSelectedFile(file);
      if (!name) setName(file.name.replace(/\.[^/.]+$/, ""));
    } else {
      toast({ title: "Invalid file type", description: "Please select a CSV or Excel file", variant: "destructive", duration: 2000 });
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
    if (selectedFile && name) createBucketMutation.mutate({ file: selectedFile, name, description });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-full bg-[#EEF2F7] dark:bg-[#0d1117]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Breadcrumbs />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-200">Create Data Bucket</h1>
            <Badge className="bg-[#105e6e] text-white uppercase tracking-tighter border-0 h-4 px-1.5 text-[9px]">Analytica</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 italic">Upload datasets for advanced AI-driven analysis and insights</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <Label className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-3">
              Source Data File
            </Label>
            {!selectedFile ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 group",
                  isDragOver ? "border-[#105e6e] bg-teal-50/50 dark:bg-teal-900/20" : "border-slate-200 dark:border-slate-700 hover:border-[#105e6e] hover:bg-slate-50 dark:hover:bg-slate-900/30"
                )}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                onClick={() => document.getElementById("bucket-file-input")?.click()}
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#105e6e]/10 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 duration-300">
                    <Upload className="h-6 w-6 text-[#105e6e] dark:text-teal-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Drop your file here, or click to browse</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Supports CSV, XLSX, XLS (Max 50MB)</p>
                </div>
                <input id="bucket-file-input" type="file" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                />
              </div>
            ) : (
              <div className="p-4 border border-teal-200 dark:border-teal-900/30 rounded-xl bg-teal-50/50 dark:bg-teal-900/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">
                    <FileSpreadsheet className="h-5 w-5 text-[#105e6e] dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedFile.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                {!createBucketMutation.isPending && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="h-8 w-8 p-0 rounded-full hover:bg-red-50 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Name & Description */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div>
              <Label htmlFor="bucket-name" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-2">
                Bucket Identifier
              </Label>
              <Input id="bucket-name" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Regional Sales Dataset Q4"
                disabled={createBucketMutation.isPending}
                className="bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
            <div>
              <Label htmlFor="bucket-desc" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-2">
                Analytical Context
              </Label>
              <Textarea id="bucket-desc" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide metadata to help Analytica's engine categorize this data accurately..."
                rows={3} disabled={createBucketMutation.isPending}
                className="bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none"
              />
            </div>
          </Card>

          {/* Upload Progress */}
          {createBucketMutation.isPending && (
            <Card className="bg-teal-50/50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-900/30 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-4 border-teal-200 border-t-[#105e6e] rounded-full animate-spin" />
                  <div>
                    <span className="font-bold text-teal-900 dark:text-teal-300 block">Deploying Dataset</span>
                    <p className="text-xs text-teal-700 dark:text-teal-400">
                      {uploadProgress < 30 ? "Uploading to secure node..." : uploadProgress < 60 ? "Analyzing structural metadata..." : uploadProgress < 90 ? "Generating statistics..." : "Finalizing deployment..."}
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-black text-[#105e6e] dark:text-teal-400">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2.5 bg-teal-200/50" />
            </Card>
          )}

          {/* Info Section */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-[#105e6e] dark:text-teal-400" />
              <span className="font-black text-xs uppercase tracking-widest text-[#105e6e] dark:text-teal-400">Analytica Engine Core</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Automatic Schema Detection", "Statistical Processing", "Data Quality Grading", "Predictive Insight Generation"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <CheckCircle className="h-3.5 w-3.5 text-[#105e6e] dark:text-teal-400 flex-shrink-0" />
                  <span className="text-[11px] font-bold uppercase">{item}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Button type="button" variant="outline" onClick={() => navigate("/hub?tab=buckets")}
              disabled={createBucketMutation.isPending}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedFile || !name || createBucketMutation.isPending}
              className="bg-[#105e6e] hover:bg-[#0d4d59] text-white min-w-[160px] font-bold uppercase text-xs tracking-widest">
              {createBucketMutation.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Deploying Dataset...</>
              ) : (
                <><Upload className="h-3.5 w-3.5 mr-2" />Initialize Bucket</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
