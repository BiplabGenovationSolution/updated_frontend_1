"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Zap,
  Brain,
  Database,
  Settings,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import type { CreateKnowledgeBaseRequest } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CreateKnowledgeBaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (knowledgeBaseId: string) => void;
}

export function CreateKnowledgeBase({
  open,
  onOpenChange,
  onSuccess,
}: CreateKnowledgeBaseProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState(
    "beautyyuyanli/multilingual-e5-large",
  );
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // UPDATED: Create mutation using new Sophia endpoint
  const createMutation = useMutation({
    mutationFn: (data: CreateKnowledgeBaseRequest) => {
      console.log("📝 Creating knowledge base with Sophia backend:", data);
      return apiClient.createKnowledgeBase(data);
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        console.log("✅ Sophia knowledge base created:", response.data);
        const { dismiss } = toast({
          title: "Success",
          description: "Sophia knowledge base created successfully",
          duration: 2000,
        });

        // Force dismiss after 2 seconds in case duration prop is ignored
        setTimeout(() => {
          dismiss();
        }, 2000);

        // Reset form
        setName("");
        setDescription("");
        setEmbeddingModel("beautyyuyanli/multilingual-e5-large");
        setChunkSize(1000);
        setChunkOverlap(200);
        setShowAdvanced(false);
        setErrors({});

        // Call success callback with the ID
        if (onSuccess && response.data.id) {
          onSuccess(response.data.id);
        }

        // Close dialog
        onOpenChange(false);
      }
    },
    onError: (error: any) => {
      console.error("❌ Failed to create Sophia knowledge base:", error);

      // Handle validation errors
      if (error.response?.data?.detail) {
        const validationErrors: Record<string, string> = {};

        if (Array.isArray(error.response.data.detail)) {
          error.response.data.detail.forEach((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : "general";
            validationErrors[field] = err.msg || "Invalid value";
          });
        }

        setErrors(validationErrors);
      } else {
        toast({
          title: "Error",
          description:
            error.message || "Failed to create Sophia knowledge base",
          variant: "destructive",
          duration: 2000,
        });
      }
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    } else if (name.trim().length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (description && description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    if (chunkSize < 100 || chunkSize > 4000) {
      newErrors.chunkSize = "Chunk size must be between 100 and 4000";
    }

    if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
      newErrors.chunkOverlap = "Chunk overlap must be less than chunk size";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FIXED: Remove user_id from request data
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const requestData: CreateKnowledgeBaseRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      embedding_model: embeddingModel,
      chunk_size: chunkSize,
      chunk_overlap: chunkOverlap,
    };

    createMutation.mutate(requestData);
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      setName("");
      setDescription("");
      setEmbeddingModel("beautyyuyanli/multilingual-e5-large");
      setChunkSize(1000);
      setChunkOverlap(200);
      setShowAdvanced(false);
      setErrors({});
      onOpenChange(false);
    }
  };

  const isFormValid =
    name.trim().length >= 3 && Object.keys(errors).length === 0;

  const embeddingModels = [
    {
      value: "beautyyuyanli/multilingual-e5-large",
      name: "E5 Large (Recommended)",
      description: "Multilingual, high accuracy",
    },
    {
      value: "text-embedding-3-small",
      name: "OpenAI Small",
      description: "Fast and efficient",
    },
    {
      value: "text-embedding-3-large",
      name: "OpenAI Large",
      description: "Higher accuracy",
    },
    {
      value: "text-embedding-ada-002",
      name: "Ada-002 (Legacy)",
      description: "Older model",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl w-[95vw] h-[85vh] p-0 gap-0 bg-white/80 dark:bg-[#161b22]/80 backdrop-blur-2xl dark:border-[#3d4555] overflow-hidden flex flex-col rounded-3xl shadow-2xl">
        {/* Header - Fixed */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-[#30363d] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#146f84]/10 dark:bg-[#146f84]/10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-[#30363d] shadow-sm">
                <Database className="h-5 w-5 text-[#146f84] dark:text-[#146f84]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Create Sophia Knowledge Base
                  <Badge className="bg-[#146f84] text-white uppercase tracking-tighter border-0 h-4 px-1.5 flex items-center justify-center text-[9px]">
                    Sophia AI
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium italic">
                  Initialize a premium intelligence layer for your document
                  search
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <form
            id="create-kb-form"
            onSubmit={handleSubmit}
            className="p-6 space-y-6"
          >
            {/* Name Field */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70"
              >
                Knowledge Base Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Strategic Research Archive"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: "" }));
                  }
                }}
                className={cn(
                  "h-10 text-sm bg-slate-50 border-slate-200 focus:border-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-[#0d1117] dark:text-white dark:border-[#30363d] dark:placeholder:text-gray-600 rounded-lg transition-all duration-300",
                  errors.name && "border-red-500 focus:border-red-600",
                )}
                disabled={createMutation.isPending}
                maxLength={100}
              />
              <div className="flex justify-between items-center px-1">
                {errors.name ? (
                  <p className="text-xs text-red-500 font-bold flex items-center gap-1 animate-pulse">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 font-medium">
                    Unique identifier for this intelligence unit
                  </p>
                )}
                <span className="text-[10px] font-mono text-gray-400">
                  {name.length}/100
                </span>
              </div>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70"
              >
                Intelligence Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the context and contents for Sophia to optimize retrieval logic..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors((prev) => ({ ...prev, description: "" }));
                  }
                }}
                className={cn(
                  "min-h-[100px] text-sm bg-slate-50 border-slate-200 focus:border-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none dark:bg-[#0d1117] dark:text-white dark:border-[#30363d] dark:placeholder:text-gray-600 rounded-lg transition-all duration-300",
                  errors.description && "border-red-500 focus:border-red-600",
                )}
                disabled={createMutation.isPending}
                maxLength={500}
              />
              <div className="flex justify-between items-center px-1">
                {errors.description && (
                  <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                )}
                <span className="text-[10px] font-mono text-gray-400 ml-auto lowercase">
                  Contextual depth: {description.length}/500
                </span>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="h-8 px-3 text-[11px] font-bold text-[#146f84] hover:text-[#105e6e] hover:bg-[#146f84]/5 rounded-lg transition-all"
                disabled={createMutation.isPending}
              >
                <Settings
                  className={cn(
                    "h-3.5 w-3.5 mr-1.5 transition-transform duration-500",
                    showAdvanced && "rotate-90",
                  )}
                />
                {showAdvanced
                  ? "Hide Intelligence Config"
                  : "Configure Advanced Intelligence"}
              </Button>
            </div>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 p-6 bg-slate-50/50 dark:bg-[#0d1117]/50 rounded-2xl border border-slate-200 dark:border-[#30363d] transition-all"
              >
                {/* Embedding Model */}
                <div className="space-y-3">
                  <Label
                    htmlFor="embeddingModel"
                    className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest"
                  >
                    Embedding Backbone
                  </Label>
                  <select
                    id="embeddingModel"
                    value={embeddingModel}
                    onChange={(e) => setEmbeddingModel(e.target.value)}
                    disabled={createMutation.isPending}
                    className="w-full px-4 py-3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-xl focus:border-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-bold dark:text-gray-200 transition-all appearance-none cursor-pointer"
                  >
                    {embeddingModels.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Chunk Size */}
                  <div className="space-y-4">
                    <Label
                      htmlFor="chunkSize"
                      className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest"
                    >
                      Resolution: {chunkSize}
                    </Label>
                    <input
                      id="chunkSize"
                      type="range"
                      min="100"
                      max="4000"
                      step="100"
                      value={chunkSize}
                      onChange={(e) => setChunkSize(parseInt(e.target.value))}
                      className="w-full accent-[#146f84] h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Chunk Overlap */}
                  <div className="space-y-4">
                    <Label
                      htmlFor="chunkOverlap"
                      className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest"
                    >
                      Overlap: {chunkOverlap}
                    </Label>
                    <input
                      id="chunkOverlap"
                      type="range"
                      min="0"
                      max={Math.floor(chunkSize * 0.5)}
                      step="50"
                      value={chunkOverlap}
                      onChange={(e) =>
                        setChunkOverlap(parseInt(e.target.value))
                      }
                      className="w-full accent-[#146f84] h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Features Info */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4">

                <span className="font-black text-xs uppercase tracking-widest text-[#146f84] dark:text-slate-300">
                  Sophia Core Advantages
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Brain, label: "Contextual Retrieval" },
                  { icon: Zap, label: "Real-time Processing" },
                  { icon: Database, label: "Vector Optimization" },
                  { icon: CheckCircle, label: "Source Verification" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 text-slate-600 dark:text-slate-400"
                  >
                    <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                      <item.icon className="h-3.5 w-3.5 text-[#146f84]" />
                    </div>
                    <span className="text-[11px] font-bold tracking-tight uppercase">
                      {item.label}
                    </span>
                  </div>
                ))}
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
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="text-red-500/70 text-sm font-bold hover:bg-red-50 hover:text-red-600 dark:text-red-400/70 dark:hover:bg-red-950/20 dark:hover:text-red-400 h-10 px-4 transition-colors"
            >
              Cancel
            </Button>
            <Button
              form="create-kb-form"
              type="submit"
              disabled={!isFormValid || createMutation.isPending}
              className={cn(
                "h-10 px-6 min-w-[160px] font-black uppercase text-[11px] tracking-widest rounded-sm transition-all duration-500 active:scale-95 shadow-md",
                isFormValid && !createMutation.isPending
                  ? "bg-[#146f84]/90 text-white hover:bg-[#146f84] hover:shadow-lg hover:translate-y-[-1px]"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none",
              )}
            >
              {createMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deploying...</span>
                </div>
              ) : (
                <span>Initialize Knowledge Base</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
