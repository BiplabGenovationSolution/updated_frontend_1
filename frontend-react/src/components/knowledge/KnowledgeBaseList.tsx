// frontend/src/components/knowledge/KnowledgeBaseList.tsx
// UPDATED TO USE NEW SOPHIA BACKEND ENDPOINTS
"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDate, cn, getDocumentCountFromKB } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Database,
  MoreHorizontal,
  Edit3,
  Copy,
  Trash2,
  Sparkles,
  Brain,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import type { KnowledgeBase } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface KnowledgeBaseListProps {
  onKnowledgeBaseSelect: (id: string | null) => void;
  selectedKnowledgeBaseId: string | null;
  includeStats?: boolean;
}

export function KnowledgeBaseList({
  onKnowledgeBaseSelect,
  selectedKnowledgeBaseId,
  includeStats = false,
}: KnowledgeBaseListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEnrichingCounts, setIsEnrichingCounts] = useState(false);
  const [kbToDelete, setKbToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // FIXED: Query using consistent cache key
  const {
    data: knowledgeBasesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["knowledgeBases", includeStats],
    queryFn: () => apiClient.getKnowledgeBases(includeStats),
    staleTime: 300000, // 5 minutes
  });

  const knowledgeBases = knowledgeBasesData?.data || [];

  // Delete knowledge base mutation
  const deleteKBMutation = useMutation({
    mutationFn: (kbId: string) => apiClient.deleteKnowledgeBase(kbId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledgeBases"] });
      toast({
        title: "Success",
        description: "Knowledge base deleted successfully",
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error("Failed to delete knowledge base:", error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge base",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  // Enhanced effect to enrich knowledge bases with document counts
  useEffect(() => {
    const enrichDocumentCounts = async () => {
      if (knowledgeBases.length > 0 && !isEnrichingCounts) {
        setIsEnrichingCounts(true);
        console.log(
          "🔄 Enriching Sophia knowledge bases with document counts...",
        );

        try {
          // Fetch document counts for all knowledge bases in parallel
          const enrichmentPromises = knowledgeBases.map(async (kb) => {
            try {
              const response = await apiClient.getKnowledgeBaseDocumentCount(
                kb.id,
              );
              // Extract count from nested response structure: response.data.count
              const documentCount = response.data?.count || 0;
              return { id: kb.id, documentCount: documentCount };
            } catch (error) {
              console.warn(
                `Failed to get document count for Sophia KB ${kb.id}:`,
                error,
              );
              return { id: kb.id, documentCount: 0 };
            }
          });

          const results = await Promise.allSettled(enrichmentPromises);

          // FIXED: Update the query cache with consistent key
          const updatedKnowledgeBases = knowledgeBases.map((kb) => {
            const result = results.find(
              (r) => r.status === "fulfilled" && r.value.id === kb.id,
            );

            if (result && result.status === "fulfilled") {
              return {
                ...kb,
                document_count: result.value.documentCount,
                documents_count: result.value.documentCount,
                doc_count: result.value.documentCount,
              };
            }

            return kb;
          });

          // FIXED: Update React Query cache with consistent key
          queryClient.setQueryData(["knowledgeBases", includeStats], {
            ...knowledgeBasesData,
            data: updatedKnowledgeBases,
          });

          console.log(
            "✅ Successfully enriched Sophia knowledge bases with document counts",
          );
        } catch (error) {
          console.error("❌ Failed to enrich Sophia document counts:", error);
        } finally {
          setIsEnrichingCounts(false);
        }
      }
    };

    // Only enrich if we have knowledge bases but no *known* document count field at all.
    // IMPORTANT: A count of 0 is a valid value (KB with no documents) and should NOT trigger enrichment.
    const needsEnrichment = knowledgeBases.some((kb) => {
      const hasAnyCountField =
        kb.document_count != null ||
        kb.documents_count != null ||
        kb.documentCount != null ||
        kb.doc_count != null ||
        kb.num_documents != null ||
        kb.total_documents != null;

      // Enrich only when there is no count field yet
      return !hasAnyCountField;
    });

    if (needsEnrichment && !isEnrichingCounts) {
      enrichDocumentCounts();
    }
  }, [
    knowledgeBases,
    includeStats,
    isEnrichingCounts,
    queryClient,
    knowledgeBasesData,
  ]);

  // FIXED: Force refresh function with consistent cache keys
  const handleForceRefresh = async () => {
    setIsEnrichingCounts(true);
    try {
      // FIXED: Clear cache with consistent keys
      queryClient.removeQueries({ queryKey: ["knowledgeBases"] });
      await refetch();

      // Force Sophia document count refresh
      // await apiClient.forceRefreshKnowledgeBases()

      console.log("✅ Sophia force refresh completed");
    } catch (error) {
      console.error("❌ Sophia force refresh failed:", error);
    } finally {
      setIsEnrichingCounts(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#146f84] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Loading Sophia knowledge bases...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Failed to load Sophia knowledge bases. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (knowledgeBases.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-[#146f84]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Database className="h-8 w-8 text-[#146f84]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Sophia Knowledge Bases
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto mb-4">
          Create your first Sophia knowledge base to get started with enhanced
          AI-powered document search and analysis
        </p>
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-[#146f84]" />
          <span className="text-xs text-[#146f84] font-medium">
            Powered by Sophia Backend
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Sophia branding */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-gray-600 dark:text-slate-300">
            Sophia Knowledge Bases
          </h3>
          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-none px-1.5 py-0">
            Enhanced
          </Badge>
          {isEnrichingCounts && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border border-slate-300 border-t-[#146f84] rounded-full animate-spin" />
              <span className="text-xs text-[#146f84]">
                Updating counts...
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 dark:text-white">
            {knowledgeBases.length} base{knowledgeBases.length !== 1 ? "s" : ""}
          </div>
          <Button
            onClick={handleForceRefresh}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            disabled={isEnrichingCounts}
          >
            <RefreshCw
              className={cn("h-3 w-3", isEnrichingCounts && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      {/* Knowledge Bases Grid */}
      <div className="flex flex-col gap-6">
        {knowledgeBases.map((kb) => (
          <SophiaKnowledgeBaseCard
            key={kb.id}
            knowledgeBase={kb}
            isSelected={selectedKnowledgeBaseId === kb.id}
            onSelect={() => onKnowledgeBaseSelect(kb.id)}
            onDeleteClick={(id, name) => setKbToDelete({ id, name })}
            includeStats={includeStats}
            isEnriching={isEnrichingCounts}
          />
        ))}
      </div>

      {/* Sophia Features Footer */}
      <Alert className="border-slate-200 bg-white dark:bg-slate-900/20 dark:border-slate-800 rounded-md">
        <Brain className="h-4 w-4" style={{ color: '#146f84' }} />
        <AlertDescription className="text-slate-600 dark:text-slate-300 text-xs">
          <div className="flex items-center justify-between pt-1">
            <span style={{ color: '#146f84' }}>Enhanced with Sophia's advanced AI processing</span>
            <div className="flex items-center gap-1 text-[#146f84]">
              <CheckCircle className="h-3 w-3" />
              <span className="font-medium">Active</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!kbToDelete}
        onOpenChange={(open) => !open && setKbToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge Base?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                "{kbToDelete?.name}"
              </span>
              ?
              <br />
              <br />
              This will permanently remove the knowledge base and all its
              documents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (kbToDelete) {
                  deleteKBMutation.mutate(kbToDelete.id);
                  setKbToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}

interface SophiaKnowledgeBaseCardProps {
  knowledgeBase: any;
  isSelected: boolean;
  onSelect: () => void;
  onDeleteClick: (id: string, name: string) => void;
  includeStats?: boolean;
  isEnriching?: boolean;
}

function SophiaKnowledgeBaseCard({
  knowledgeBase,
  isSelected,
  onSelect,
  onDeleteClick,
  includeStats = false,
  isEnriching = false,
}: SophiaKnowledgeBaseCardProps) {
  // Enhanced document count extraction
  const getDocumentCount = (): number => {
    return getDocumentCountFromKB(knowledgeBase);
  };

  const documentCount = getDocumentCount();

  // Get health status
  const getHealthStatus = () => {
    return knowledgeBase.health_status || "healthy";
  };

  const healthStatus = getHealthStatus();

  // Get processing stats if available
  const processingStats = knowledgeBase.processing_stats;

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md group border border-gray-300 dark:border-slate-700 relative overflow-hidden bg-white dark:bg-[#161b22] rounded-md",
        isSelected &&
        "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-[#3d4555] dark:to-[#454d5f] shadow-md ring-1 ring-slate-200 dark:ring-[#58a6ff]"
      )}
      onClick={onSelect}
    >


      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4
              className={cn(
                "text-sm font-semibold truncate",
                isSelected
                  ? "text-[#146f84]"
                  : "text-slate-900 dark:text-slate-300",
              )}
            >
              {knowledgeBase.name}
            </h4>

            {/* Enhanced Status Badges */}
            <div className="flex items-center gap-1">
              {isSelected && <CheckCircle className="h-4 w-4 text-green-600" />}

              {/* Health Status Badge */}
              <Badge
                className={cn(
                  "text-[10px] px-1.5 py-0 border border-gray-300 dark:border-gray-600 rounded-none",
                  healthStatus === "healthy" && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                  healthStatus === "degraded" &&
                  "bg-yellow-100 text-yellow-800",
                  healthStatus === "unhealthy" && "bg-red-100 text-red-800",
                )}
              >
                {healthStatus}
              </Badge>

              {/* Embedding Model Badge */}
              {knowledgeBase.embedding_model && (
                <Badge className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 border border-slate-200 rounded-none dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  {knowledgeBase.embedding_model.includes("small")
                    ? "Small"
                    : knowledgeBase.embedding_model.includes("large")
                      ? "Large"
                      : "Standard"}
                </Badge>
              )}
            </div>
          </div>

          {knowledgeBase.description && (
            <p
              className={cn(
                "text-[11px] leading-relaxed mb-2 line-clamp-2",
                isSelected
                  ? "text-[#146f84] dark:text-[#146f84]"
                  : "text-slate-600 dark:text-slate-300",
              )}
            >
              {knowledgeBase.description}
            </p>
          )}

          {/* Enhanced Metadata with Document Count */}
          <div className="space-y-1.5">
            {/* Document and Vector Counts */}
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "font-medium flex items-center gap-1",
                    isSelected
                      ? "text-[#146f84]"
                      : "text-slate-700 dark:text-slate-300",
                  )}
                >
                  {isEnriching && documentCount === 0 ? (
                    <>
                      <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      {documentCount} doc{documentCount !== 1 ? "s" : ""}
                    </>
                  )}
                </span>
              </div>

              {knowledgeBase.vector_count && (
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "font-medium",
                      isSelected
                        ? "text-[#146f84]"
                        : "text-slate-700 dark:text-slate-300",
                    )}
                  >
                    {knowledgeBase.vector_count.toLocaleString()} vectors
                  </span>
                </div>
              )}

              {/* Chunk Settings */}
              {knowledgeBase.chunk_size && (
                <span
                  className={cn(
                    "text-xs",
                    isSelected
                      ? "text-[#146f84]"
                      : "text-slate-500 dark:text-slate-300",
                  )}
                >
                  {knowledgeBase.chunk_size}t chunks
                </span>
              )}
            </div>

            {/* Processing Stats (if available) */}
            {includeStats && processingStats && (
              <div className="flex items-center gap-2 text-xs">
                {processingStats.pending > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-0">
                    {processingStats.pending} pending
                  </Badge>
                )}
                {processingStats.processing > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 border-0">
                    {processingStats.processing} processing
                  </Badge>
                )}
                {processingStats.failed > 0 && (
                  <Badge className="bg-red-100 text-red-800 border-0">
                    {processingStats.failed} failed
                  </Badge>
                )}
              </div>
            )}

            {/* Timestamps and Storage */}
            <div className="flex items-center gap-3 text-xs">
              <span
                className={cn(
                  isSelected
                    ? "text-[#146f84]"
                    : "text-slate-500 dark:text-slate-300",
                )}
              >
                Created {formatDate(knowledgeBase.created_at)}
              </span>

              {knowledgeBase.last_accessed && (
                <span
                  className={cn(
                    isSelected
                      ? "text-[#146f84]"
                      : "text-slate-500 dark:text-slate-300",
                  )}
                >
                  Last used {formatDate(knowledgeBase.last_accessed)}
                </span>
              )}

              {knowledgeBase.storage_size && (
                <span
                  className={cn(
                    isSelected
                      ? "text-[#146f84]"
                      : "text-slate-500 dark:text-slate-300",
                  )}
                >
                  {(knowledgeBase.storage_size / 1024 / 1024).toFixed(1)} MB
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 w-6 p-0 opacity-100 transition-opacity",
                isSelected
                  ? "hover:bg-[#146f84]/10"
                  : "hover:bg-gray-100 dark:bg-[#2d3545]",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Sophia KB
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Brain className="h-4 w-4 mr-2" />
              View Analytics
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Database className="h-4 w-4 mr-2" />
              Export Data
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(knowledgeBase.id, knowledgeBase.name);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete from Sophia
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sophia Enhancement Indicator */}
      <div className="absolute bottom-2 right-2 opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-xs text-[#146f84] dark:text-slate-300">
          <span className="font-medium">Sophia</span>
        </div>
      </div>
    </Card>
  );
}
