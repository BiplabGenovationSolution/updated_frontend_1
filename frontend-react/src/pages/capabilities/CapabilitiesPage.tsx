import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  Code,
  Play,
  Settings,
  Tag,
  Clock,
  TrendingUp,
  AlertCircle,
  Check,
  Loader2,
  Zap,
  FileCode,
  Terminal,
  Copy,
  Cpu,
} from "lucide-react";
import { motion } from "motion/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Capability } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function CapabilitiesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");


  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionParams, setExecutionParams] = useState<Record<string, any>>({});
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<Capability | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Load capabilities
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth/login");
      return;
    }
    loadCapabilities();
  }, [user, authLoading, navigate]);

  // Check for action parameter in URL and redirect to create page
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create") {
      navigate("/capabilities/create");
    }
  }, [searchParams, navigate]);

  const loadCapabilities = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getCapabilities({
        limit: 100,
      });

      if (response.success && response.data) {
        setCapabilities(response.data.capabilities || []);
      }
    } catch (error) {
      console.error("Failed to load capabilities:", error);
      toast({
        title: "Error",
        description: "Failed to load capabilities",
        variant: "destructive",
        duration: 2000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      // Modern clipboard API (preferred)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return false;
    }
  };


  const handleDeleteCapability = async (capabilityId: string) => {
    if (!confirm("Are you sure you want to delete this capability?")) return;

    try {
      const response = await apiClient.deleteCapability(capabilityId, false);

      if (response.success) {
        toast({
          title: "Success",
          description: "Capability deleted successfully",
          duration: 2000
        });
        loadCapabilities();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete capability",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const handleDuplicateCapability = async (
    capabilityId: string,
    originalName: string,
  ) => {
    const newName = prompt(
      `Duplicate capability "${originalName}".\n\nEnter name for the copy:`,
      `${originalName} (Copy)`,
    );

    if (!newName || !newName.trim()) {
      return; // User cancelled
    }

    try {
      const response = await apiClient.capabilities.duplicate(
        capabilityId,
        newName.trim(),
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Capability duplicated as "${newName.trim()}"`,
          duration: 2000
        });
        loadCapabilities();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate capability",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const handleExecuteCapability = async () => {
    if (!selectedCapability) return;

    try {
      setIsExecuting(true);

      // Convert parameters to correct types based on parameter definitions
      const convertedParams: Record<string, any> = {};
      selectedCapability.parameters.forEach((param) => {
        const value = executionParams[param.name];

        // Skip if empty and not required
        if (
          (value === "" || value === null || value === undefined) &&
          !param.required
        ) {
          if (param.default !== undefined) {
            convertedParams[param.name] = param.default;
          }
          return;
        }

        // Convert based on type
        switch (param.type) {
          case "number":
            convertedParams[param.name] =
              value === "" ? (param.default ?? 0) : Number(value);
            break;
          case "boolean":
            convertedParams[param.name] = value === true || value === "true";
            break;
          case "array":
            try {
              convertedParams[param.name] =
                typeof value === "string" ? JSON.parse(value) : value;
            } catch {
              convertedParams[param.name] = value;
            }
            break;
          case "object":
            try {
              convertedParams[param.name] =
                typeof value === "string" ? JSON.parse(value) : value;
            } catch {
              convertedParams[param.name] = value;
            }
            break;
          default:
            convertedParams[param.name] = value;
        }
      });

      const response = await apiClient.executeCapability(
        selectedCapability.id,
        convertedParams,
      );

      if (response.success && response.data) {
        setExecutionResult(response.data);
        toast({
          title: "Success",
          description: "Capability executed successfully",
          duration: 2000
        });
      }
    } catch (error: any) {
      toast({
        title: "Execution Error",
        description: error.message || "Failed to execute capability",
        variant: "destructive",
        duration: 2000
      });
      setExecutionResult({
        success: false,
        error: error.message || "Execution failed",
      });
    } finally {
      setIsExecuting(false);
    }
  };


  const openExecuteDialog = (capability: Capability) => {
    setSelectedCapability(capability);
    const initialParams: Record<string, any> = {};
    capability.parameters.forEach((param) => {
      initialParams[param.name] = param.default || "";
    });
    setExecutionParams(initialParams);
    setExecutionResult(null);
    setIsExecuteDialogOpen(true);
  };



  // Filter capabilities
  const filteredCapabilities = capabilities.filter((capability) => {
    const matchesSearch =
      capability.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capability.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || capability.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get all unique categories
  const allCategories = Array.from(
    new Set(capabilities.map((c) => c.category)),
  );



  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-200 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading Capabilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#EEF2F7] dark:bg-[#0d1117] min-h-full">

      <div className="flex-1">
        {/* Hero Section */}

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-[#EEF2F7] dark:bg-[#0d1117] p-8 transition-colors duration-300">
          {/* No gradient background */}

          <div className="max-w-7xl mx-auto px-6 relative">
            <Breadcrumbs />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between mb-8"
            >
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-300">
                    Capabilities
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                    Create and manage custom functions for your agents
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/library?tab=capabilities")}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Browse Marketplace
                </Button>
                <Button
                  onClick={() => {
                    navigate("/capabilities/create");
                  }}
                  className="bg-[#146f84] hover:bg-[#105e6e] text-white transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Capability
                </Button>
              </div>
            </motion.div>

            {/* Stats Cards - Staggered Entry */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
            >
              {[
                {
                  label: "Total Capabilities",
                  count: capabilities.length,
                  sub: "Custom Functions",
                  icon: Code,
                  color: "purple",
                },
                {
                  label: "Categories",
                  count: allCategories.length,
                  sub: "Function Types",
                  icon: Tag,
                  color: "blue",
                },
                {
                  label: "Total Executions",
                  count: capabilities.reduce((acc, c) => acc + c.usage_count, 0),
                  sub: "Function Calls",
                  icon: Zap,
                  color: "amber",
                },
                {
                  label: "Active",
                  count: capabilities.filter((c) => c.status === "active").length,
                  sub: "Ready to Use",
                  icon: TrendingUp,
                  color: "emerald",
                },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="bg-white dark:bg-[#1c2128] 
                    border border-slate-200 dark:border-slate-800 
                    rounded-md px-4 py-4  
                    flex items-center justify-between
                    hover:border-blue-400/40 dark:hover:border-blue-500/30
                    transition-all duration-200"
                >
                  <div className="flex flex-col">
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {stat.sub}
                    </p>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stat.count}
                  </h3>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Search and Filter - Sticky */}
          <div
            className="sticky top-0 z-20 -mx-6 px-6 py-4 mb-6 backdrop-blur-xl transition-all duration-200 bg-[#EEF2F7]/95 dark:bg-[#0d1117]/95"
            id="sticky-library-search"

          >
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#146f84] transition-colors" />
                  <Input
                    placeholder="Search capabilities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-[#146f84]/20 transition-all"
                  />
                </div>
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48 bg-white/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Capabilities Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-[#146f84] rounded-full animate-spin mb-4" />
              <p className="text-gray-600">Loading capabilities...</p>
            </div>
          ) : filteredCapabilities.length === 0 ? (
            <Card className="border bg-white dark:bg-[#1c2128] dark:border-slate-800">
              <CardContent className="p-12 text-center">
                <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">
                  No capabilities found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || filterCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first capability to extend agent functionality"}
                </p>
                {!searchQuery && filterCategory === "all" && (
                  <Button onClick={() => navigate("/capabilities/create")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Capability
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCapabilities.map((capability) => (
                <Card
                  key={capability.id}
                  className="rounded-md border border-slate-200 dark:border-slate-800 transition-all duration-200 bg-white dark:bg-[#1c2128] overflow-hidden cursor-pointer group hover:border-blue-400/40 dark:hover:border-blue-500/30"
                  onClick={() => navigate(`/capabilities/${capability.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      {/* Title & Description */}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-bold truncate text-slate-900 dark:text-slate-300 group-hover:text-[#146f84] transition-colors">
                          {capability.name}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-2 mt-1 text-slate-500 dark:text-slate-400">
                          {capability.description}
                        </CardDescription>
                      </div>
                      {/* Dropdown only on right */}
                      <div className="flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 dark:text-slate-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="dark:bg-[#1c2128] dark:border-slate-800"
                          >
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/capabilities/${capability.id}`);
                              }}
                              className="dark:text-gray-200 dark:focus:bg-gray-800"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openExecuteDialog(capability);
                              }}
                              className="dark:text-gray-200 dark:focus:bg-gray-800"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Execute
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/capabilities/${capability.id}/edit`);
                              }}
                              className="dark:text-gray-200 dark:focus:bg-gray-800"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateCapability(
                                  capability.id,
                                  capability.name,
                                );
                              }}
                              className="dark:text-gray-200 dark:focus:bg-gray-800"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                const success = await copyToClipboard(
                                  capability.id,
                                );
                                toast({
                                  title: success ? "Copied!" : "Failed to copy",
                                  description: success
                                    ? "Capability ID copied to clipboard"
                                    : "Could not copy to clipboard",
                                  variant: success ? "default" : "destructive",
                                  duration: 2000
                                });
                              }}
                              className="dark:text-gray-200 dark:focus:bg-gray-800"
                            >
                              <FileCode className="h-4 w-4 mr-2" />
                              Copy Capability ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="dark:bg-gray-700" />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCapability(capability.id);
                              }}
                              className="text-red-600 dark:text-red-400 dark:focus:bg-gray-800"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Category & Tags - limit to 2 tags plus category */}
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          variant="secondary"
                          className="text-xs truncate max-w-[100px] bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:hover:bg-gray-700"
                        >
                          {capability.category}
                        </Badge>
                        {capability.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs truncate max-w-[80px] dark:border-gray-600 dark:text-gray-300"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {capability.tags.length > 2 && (
                          <Badge
                            variant="outline"
                            className="text-xs dark:border-gray-600 dark:text-gray-300"
                          >
                            +{capability.tags.length - 2}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t dark:border-gray-700">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Parameters
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                            {capability.parameters.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Usage
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                            {capability.usage_count}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Timeout
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                            {capability.timeout_seconds}s
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(capability.created_at)}
                        </div>
                        <Badge
                          className={`text-xs border-0 ${capability.status === "active" ? "bg-[#146f84]/10 text-[#146f84]" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
                        >
                          {capability.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Execute Dialog */}
      <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Execute: {selectedCapability?.name}
            </DialogTitle>
            <DialogDescription>
              Configure parameters and execute the capability
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Parameters Section */}
            {selectedCapability && selectedCapability.parameters.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Parameters
                </h3>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  {selectedCapability.parameters.map((param) => (
                    <div
                      key={param.name}
                      className="bg-white p-3 rounded border"
                    >
                      <Label
                        htmlFor={param.name}
                        className="text-sm font-medium flex items-center gap-2 mb-2"
                      >
                        <code className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-mono">
                          {param.name}
                        </code>
                        {param.required && (
                          <Badge variant="destructive" className="text-xs">
                            required
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {param.type}
                        </Badge>
                      </Label>

                      {/* Type-specific input */}
                      {param.type === "boolean" ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            id={param.name}
                            type="checkbox"
                            checked={
                              executionParams[param.name] === true ||
                              executionParams[param.name] === "true"
                            }
                            onChange={(e) =>
                              setExecutionParams({
                                ...executionParams,
                                [param.name]: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <Label
                            htmlFor={param.name}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {param.description || "Enable this option"}
                          </Label>
                        </div>
                      ) : param.type === "number" ? (
                        <Input
                          id={param.name}
                          type="number"
                          placeholder={
                            param.description || `Enter ${param.name}`
                          }
                          value={
                            executionParams[param.name] ?? param.default ?? ""
                          }
                          onChange={(e) =>
                            setExecutionParams({
                              ...executionParams,
                              [param.name]: e.target.value,
                            })
                          }
                          className="mt-2"
                        />
                      ) : (
                        <Input
                          id={param.name}
                          type="text"
                          placeholder={
                            param.description || `Enter ${param.name}`
                          }
                          value={
                            executionParams[param.name] ?? param.default ?? ""
                          }
                          onChange={(e) =>
                            setExecutionParams({
                              ...executionParams,
                              [param.name]: e.target.value,
                            })
                          }
                          className="mt-2"
                        />
                      )}

                      {param.description && param.type !== "boolean" && (
                        <p className="text-xs text-gray-500 mt-1">
                          {param.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Section */}
            {executionResult && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Execution Result
                </h3>
                <Card
                  className={
                    executionResult.success
                      ? "border-green-200"
                      : "border-red-200"
                  }
                >
                  <CardHeader
                    className={
                      executionResult.success
                        ? "bg-green-50 pb-3"
                        : "bg-red-50 pb-3"
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {executionResult.success ? (
                          <>
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-800">
                              Success
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="font-semibold text-red-800">
                              Error
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {executionResult.execution_time_ms}ms
                        </Badge>
                        {executionResult.success && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                JSON.stringify(executionResult.result, null, 2),
                              );
                              toast({
                                title: "Copied!",
                                description: "Result copied to clipboard",
                                variant: "default",
                                duration: 2000
                              });
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {executionResult.success ? (
                      <Tabs defaultValue="result" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="result">Result</TabsTrigger>
                          <TabsTrigger value="output">Output</TabsTrigger>
                          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                        </TabsList>
                        <TabsContent value="result" className="mt-3">
                          <div className="max-h-[400px] overflow-y-auto">
                            <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-words bg-gray-50 p-4 rounded">
                              {typeof executionResult.result === "string"
                                ? executionResult.result
                                : JSON.stringify(
                                  executionResult.result,
                                  null,
                                  2,
                                )}
                            </pre>
                          </div>
                        </TabsContent>
                        <TabsContent value="output" className="mt-3">
                          <div className="max-h-[400px] overflow-y-auto">
                            {executionResult.print_output ? (
                              <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded">
                                {executionResult.print_output}
                              </pre>
                            ) : (
                              <p className="text-sm text-gray-500 italic p-4">
                                No output
                              </p>
                            )}
                          </div>
                        </TabsContent>
                        <TabsContent value="raw" className="mt-3">
                          <div className="max-h-[400px] overflow-y-auto">
                            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded">
                              {JSON.stringify(executionResult, null, 2)}
                            </pre>
                          </div>
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <div className="max-h-[400px] overflow-y-auto">
                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription>
                            <pre className="text-sm font-mono text-red-700 whitespace-pre-wrap break-words">
                              {executionResult.error}
                            </pre>
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsExecuteDialogOpen(false);
                setExecutionResult(null);
                setExecutionParams({});
              }}
            >
              Close
            </Button>
            <Button
              onClick={handleExecuteCapability}
              disabled={isExecuting}
              className="min-w-[120px] bg-[#146f84] hover:bg-[#105e6e] text-white"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
