"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Brain, Zap, Database, CheckCircle, Settings, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api";
import type { CreateKnowledgeBaseRequest } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function CreateKnowledgeBasePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("beautyyuyanli/multilingual-e5-large");
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: CreateKnowledgeBaseRequest) => apiClient.createKnowledgeBase(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        toast({ title: "Success", description: "Sophia knowledge base created successfully", duration: 2000 });
        navigate("/hub?tab=knowledge");
      }
    },
    onError: (error: any) => {
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
        toast({ title: "Error", description: error.message || "Failed to create knowledge base", variant: "destructive", duration: 2000 });
      }
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    else if (name.trim().length < 3) newErrors.name = "Name must be at least 3 characters";
    else if (name.trim().length > 100) newErrors.name = "Name must be less than 100 characters";
    if (description && description.length > 500) newErrors.description = "Description must be less than 500 characters";
    if (chunkSize < 100 || chunkSize > 4000) newErrors.chunkSize = "Chunk size must be between 100 and 4000";
    if (chunkOverlap < 0 || chunkOverlap >= chunkSize) newErrors.chunkOverlap = "Chunk overlap must be less than chunk size";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      embedding_model: embeddingModel,
      chunk_size: chunkSize,
      chunk_overlap: chunkOverlap,
    });
  };

  const isFormValid = name.trim().length >= 3 && Object.keys(errors).length === 0;

  const embeddingModels = [
    { value: "beautyyuyanli/multilingual-e5-large", name: "E5 Large (Recommended)", description: "Multilingual, high accuracy" },
    { value: "text-embedding-3-small", name: "OpenAI Small", description: "Fast and efficient" },
    { value: "text-embedding-3-large", name: "OpenAI Large", description: "Higher accuracy" },
    { value: "text-embedding-ada-002", name: "Ada-002 (Legacy)", description: "Older model" },
  ];

  return (
    <div className="min-h-full bg-[#EEF2F7] dark:bg-[#0d1117]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Breadcrumbs />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Knowledge Base</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Initialize a new knowledge base for your document search</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Description */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="kb-name" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block">
                Knowledge Base Name
              </Label>
              <Input
                id="kb-name"
                type="text"
                placeholder="e.g., Strategic Research Archive"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((prev) => ({ ...prev, name: "" })); }}
                className={cn(
                  "bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600",
                  errors.name && "border-red-500"
                )}
                disabled={createMutation.isPending}
                maxLength={100}
              />
              <div className="flex justify-between items-center px-1">
                {errors.name ? (
                  <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{errors.name}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Unique identifier for this intelligence unit</p>
                )}
                <span className="text-[10px] font-mono text-gray-400">{name.length}/100</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="kb-desc" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block">
                Intelligence Description
              </Label>
              <Textarea
                id="kb-desc"
                placeholder="Describe the context and contents for Sophia to optimize retrieval logic..."
                value={description}
                onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors((prev) => ({ ...prev, description: "" })); }}
                className={cn(
                  "min-h-[100px] bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none",
                  errors.description && "border-red-500"
                )}
                disabled={createMutation.isPending}
                maxLength={500}
              />
              <div className="flex justify-end px-1">
                <span className="text-[10px] font-mono text-gray-400 lowercase">Contextual depth: {description.length}/500</span>
              </div>
            </div>
          </Card>

          {/* Advanced Settings */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 p-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="h-8 px-3 text-[11px] font-bold text-[#146f84] hover:text-[#105e6e] hover:bg-[#146f84]/5 rounded-lg transition-all"
              disabled={createMutation.isPending}
            >
              <Settings className={cn("h-3.5 w-3.5 mr-1.5 transition-transform duration-500", showAdvanced && "rotate-90")} />
              {showAdvanced ? "Hide Intelligence Config" : "Configure Advanced Intelligence"}
            </Button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 mt-4 p-6 bg-slate-50/50 dark:bg-[#0d1117]/50 rounded-2xl border border-slate-200 dark:border-slate-700"
              >
                {/* Embedding Model */}
                <div className="space-y-3">
                  <Label htmlFor="embeddingModel" className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Embedding Backbone
                  </Label>
                  <select
                    id="embeddingModel"
                    value={embeddingModel}
                    onChange={(e) => setEmbeddingModel(e.target.value)}
                    disabled={createMutation.isPending}
                    className="w-full px-4 py-3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-gray-200 transition-all appearance-none cursor-pointer"
                  >
                    {embeddingModels.map((model) => (
                      <option key={model.value} value={model.value}>{model.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label htmlFor="chunkSize" className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
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
                  <div className="space-y-4">
                    <Label htmlFor="chunkOverlap" className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      Overlap: {chunkOverlap}
                    </Label>
                    <input
                      id="chunkOverlap"
                      type="range"
                      min="0"
                      max={Math.floor(chunkSize * 0.5)}
                      step="50"
                      value={chunkOverlap}
                      onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                      className="w-full accent-[#146f84] h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </Card>

          {/* Features Info */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-black text-xs uppercase tracking-widest text-[#146f84] dark:text-teal-400">Sophia Core Advantages</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Brain, label: "Contextual Retrieval" },
                { icon: Zap, label: "Real-time Processing" },
                { icon: Database, label: "Vector Optimization" },
                { icon: CheckCircle, label: "Source Verification" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <item.icon className="h-3.5 w-3.5 text-[#146f84]" />
                  </div>
                  <span className="text-[11px] font-bold tracking-tight uppercase">{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/hub?tab=knowledge")}
              disabled={createMutation.isPending}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createMutation.isPending}
              className="bg-[#105e6e] hover:bg-[#0d4d59] text-white min-w-[180px] font-bold uppercase text-xs tracking-widest"
            >
              {createMutation.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Deploying...</>
              ) : (
                "Initialize Knowledge Base"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
