import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Save,
  Trash2,
  Copy,
  Lock,
  ChevronDown,
  ChevronUp,
  Edit,
  ArrowLeft,
  Loader2,
  FileJson,
  Upload,
  Download,
  Check,
  Cpu,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CapabilityParameter } from "@/lib/types";
import Editor from "@monaco-editor/react";

const categories = [
  "utility",
  "math",
  "text",
  "data",
  "web",
  "file",
  "research",
  "analysis",
];

const EMPTY_PARAMETER: CapabilityParameter = {
  name: "",
  type: "string",
  description: "",
  required: true,
  copyable: false,
  sensitive: false,
  llm_collection: {
    prompt: "",
    extraction_hint: "",
    examples: [],
    context_aware: false,
  },
  validation: {
    enabled: false,
    instruction: "",
    on_invalid: "retry",
    max_retries: 3,
    retry_prompt: "",
    examples: {
      valid: [],
      invalid: [],
    },
  },
  confirmation: {
    enabled: false,
    template: "",
    allow_correction: true,
    correction_prompt: "",
    max_corrections: 2,
  },
};

export default function EditCapabilityPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "utility",
    code: "",
    parameters: [] as CapabilityParameter[],
    return_type: "string",
    timeout_seconds: 30,
    tags: [] as string[],
  });

  const [newParameter, setNewParameter] = useState<CapabilityParameter>({
    ...EMPTY_PARAMETER,
  });

  // Parameter accordion state
  const [expandedParamIndex, setExpandedParamIndex] = useState<number | null>(null);
  const [editingParamIndex, setEditingParamIndex] = useState<number | null>(null);
  const [editedParameter, setEditedParameter] = useState<CapabilityParameter | null>(null);

  // Import dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importJSON, setImportJSON] = useState("");
  const [importMethod, setImportMethod] = useState<"paste" | "upload">("paste");

  // Load capability data
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const response: any = await apiClient.getCapability(id);
        if (response.success && response.data) {
          const cap = response.data.capability || response.data;
          setFormData({
            name: cap.name,
            description: cap.description,
            category: cap.category || "utility",
            code: cap.code,
            parameters: cap.parameters || [],
            return_type: cap.return_type || "string",
            timeout_seconds: cap.timeout_seconds || 30,
            tags: cap.tags || [],
          });
        } else {
          toast({
            title: "Error",
            description: "Capability not found",
            variant: "destructive",
            duration: 2000,
          });
          navigate("/capabilities");
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load capability",
          variant: "destructive",
          duration: 2000,
        });
        navigate("/capabilities");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, navigate, toast]);

  const validateCode = (code: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!code.trim()) {
      errors.push("Code cannot be empty");
    }
    if (!code.includes("def main(")) {
      errors.push("Code must contain a main() function");
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const handleUpdateCapability = async () => {
    const validation = validateCode(formData.code);
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(", "),
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await apiClient.updateCapability(id!, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        code: formData.code,
        parameters: formData.parameters,
        return_type: formData.return_type,
        timeout_seconds: formData.timeout_seconds,
        tags: formData.tags,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Capability ${formData.name} updated successfully`,
          duration: 2000,
        });
        navigate("/capabilities");
      } else {
        throw new Error(response.error || "Failed to update capability");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update capability",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addParameter = () => {
    if (!newParameter.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Parameter name is required",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    if (formData.parameters.some((p) => p.name === newParameter.name)) {
      toast({
        title: "Validation Error",
        description: "A parameter with this name already exists",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    setFormData({
      ...formData,
      parameters: [...formData.parameters, { ...newParameter }],
    });
    setNewParameter({ ...EMPTY_PARAMETER });

    toast({
      title: "Parameter Added",
      description: `Added parameter ${newParameter.name}`,
      duration: 2000,
    });
  };

  const removeParameter = (index: number) => {
    setFormData({
      ...formData,
      parameters: formData.parameters.filter((_, i) => i !== index),
    });
    if (expandedParamIndex === index) {
      setExpandedParamIndex(null);
      setEditingParamIndex(null);
    }
  };

  const toggleParameterExpansion = (index: number) => {
    if (expandedParamIndex === index) {
      setExpandedParamIndex(null);
      setEditingParamIndex(null);
      setEditedParameter(null);
    } else {
      setExpandedParamIndex(index);
      setEditingParamIndex(null);
      setEditedParameter(null);
    }
  };

  const startEditingParameter = (index: number) => {
    setEditingParamIndex(index);
    setEditedParameter({ ...formData.parameters[index] });
  };

  const saveEditedParameter = () => {
    if (editingParamIndex !== null && editedParameter) {
      const updatedParameters = [...formData.parameters];
      updatedParameters[editingParamIndex] = editedParameter;
      setFormData({
        ...formData,
        parameters: updatedParameters,
      });
      setEditingParamIndex(null);
      setEditedParameter(null);
      toast({
        title: "Parameter Updated",
        description: `Successfully updated parameter: ${editedParameter.name}`,
        duration: 2000,
      });
    }
  };

  const cancelEditingParameter = () => {
    setEditingParamIndex(null);
    setEditedParameter(null);
  };

  const handleOpenImportDialog = () => {
    setImportJSON("");
    setImportMethod("paste");
    setIsImportDialogOpen(true);
  };

  const handleImportFromJSON = () => {
    try {
      const parsed = JSON.parse(importJSON);

      setFormData({
        ...formData,
        name: parsed.name || formData.name,
        description: parsed.description || formData.description,
        category: parsed.category || formData.category,
        code: parsed.code || formData.code,
        parameters: parsed.parameters || formData.parameters,
        return_type: parsed.return_type || formData.return_type,
        timeout_seconds: parsed.timeout_seconds || formData.timeout_seconds,
        tags: parsed.tags || formData.tags,
      });

      setIsImportDialogOpen(false);
      setImportJSON("");

      toast({
        title: "Import Successful",
        description: "Capability configuration loaded from JSON",
        duration: 2000,
      });
    } catch (e) {
      toast({
        title: "Import Failed",
        description: "Invalid JSON format",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          JSON.parse(content);
          setImportJSON(content);
        } catch (err) {
          toast({
            title: "Invalid File",
            description: "The selected file does not contain valid JSON",
            variant: "destructive",
            duration: 2000,
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportToJSON = async () => {
    try {
      const exportData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        code: formData.code,
        parameters: formData.parameters,
        return_type: formData.return_type,
        timeout_seconds: formData.timeout_seconds,
        tags: formData.tags,
        export_version: "1.0",
        export_date: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_capability.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Capability configuration exported to JSON file",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not copy to clipboard or create file",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-[#edf2f7] dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#105e6e]" />
          <p className="text-gray-600 dark:text-gray-400">Loading capability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#edf2f7] dark:bg-[#0d1117]">

      {/* Header */}
      <div className="flex-none bg-white dark:bg-[#0d1117] px-10 py-4 flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/capabilities")}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            Edit Capability
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Update your custom capability function
          </p>
        </div>
      </div>

      {/* Stats Cards - moved below header, inside main content */}
      <div className="max-w-4xl mx-auto w-full mt-6 mb-2 px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border rounded-sm shadow-none bg-white dark:bg-[#1e2433] dark:border-[#2d3545]">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Status</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">Ready</span>
            </CardContent>
          </Card>
          <Card className="border rounded-sm shadow-none bg-white dark:bg-[#1e2433] dark:border-[#2d3545]">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Category</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 capitalize">{formData.category || 'Utility'}</span>
            </CardContent>
          </Card>
          <Card className="border rounded-sm shadow-none bg-white dark:bg-[#1e2433] dark:border-[#2d3545]">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Version</span>
              <span className="text-2xl font-bold text-slate-500 dark:text-slate-400 mt-1">1.2.0</span>
            </CardContent>
          </Card>
          <Card className="border rounded-sm shadow-none bg-white dark:bg-[#1e2433] dark:border-[#2d3545]">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Compute</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Optimized</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 scrollbar-minimal">
        <div className="max-w-4xl mx-auto space-y-8 pb-12">

          {/* Import/Export Section - grey bg, no emoji in title */}
          <div className="p-4 border border-slate-200 rounded-sm bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <FileJson className="h-5 w-5 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Quick Actions - Import/Export JSON
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Import a capability from JSON for rapid testing, or export your current configuration
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenImportDialog}
                    className="flex-1 rounded-sm border-slate-300 text-white bg-[#105e6e] hover:bg-[#105e6e]/90 border-[#105e6e] dark:border-[#105e6e] dark:bg-[#105e6e] dark:text-white dark:hover:bg-[#105e6e]/90"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import from JSON
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExportToJSON}
                    className="flex-1 rounded-sm border-slate-300 text-white bg-[#105e6e] hover:bg-[#105e6e]/90 border-[#105e6e] dark:border-[#105e6e] dark:bg-[#105e6e] dark:text-white dark:hover:bg-[#105e6e]/90"
                    disabled={!formData.name && !formData.code}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to JSON
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Calculate Sum"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 rounded-sm"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="mt-1 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this capability does..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="mt-1 rounded-sm"
              />
            </div>

            {/* Code Editor */}
            <div>
              <Label>Code *</Label>
              <div className="border rounded-sm overflow-hidden mt-2">
                <Editor
                  height="300px"
                  defaultLanguage="python"
                  theme="vs-dark"
                  value={formData.code}
                  onChange={(value) => setFormData({ ...formData, code: value || "" })}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    scrollbar: {
                      vertical: 'visible',
                      horizontal: 'visible',
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8,
                    },
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Code must contain a <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded-sm">main()</code> function
              </p>
            </div>

            {/* Parameters */}
            <div>
              <Label>Parameters</Label>
              <div className="space-y-3 mt-2">
                <Card className="p-4 rounded-sm bg-gray-50 dark:bg-slate-900 dark:border-slate-800">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="param-name" className="text-xs">Name *</Label>
                        <Input
                          id="param-name"
                          placeholder="Parameter name"
                          value={newParameter.name}
                          onChange={(e) =>
                            setNewParameter({ ...newParameter, name: e.target.value })
                          }
                          className="rounded-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="param-type" className="text-xs">Type</Label>
                        <Select
                          value={newParameter.type}
                          onValueChange={(value: any) =>
                            setNewParameter({ ...newParameter, type: value })
                          }
                        >
                          <SelectTrigger id="param-type" className="rounded-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="array">Array</SelectItem>
                            <SelectItem value="object">Object</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="param-desc" className="text-xs">Description</Label>
                      <Input
                        id="param-desc"
                        placeholder="Parameter description"
                        value={newParameter.description || ""}
                        onChange={(e) =>
                          setNewParameter({ ...newParameter, description: e.target.value })
                        }
                        className="rounded-sm"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          id="param-required"
                          type="checkbox"
                          checked={newParameter.required}
                          onChange={(e) =>
                            setNewParameter({ ...newParameter, required: e.target.checked })
                          }
                          className="w-4 h-4 rounded-sm border-gray-300"
                        />
                        <Label htmlFor="param-required" className="text-sm font-normal cursor-pointer">
                          Required
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id="param-copyable"
                          type="checkbox"
                          checked={newParameter.copyable || false}
                          onChange={(e) =>
                            setNewParameter({ ...newParameter, copyable: e.target.checked })
                          }
                          className="w-4 h-4 rounded-sm border-gray-300"
                        />
                        <Label htmlFor="param-copyable" className="text-sm font-normal cursor-pointer flex items-center gap-1">
                          <Copy className="h-3 w-3" />
                          Copyable
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id="param-sensitive"
                          type="checkbox"
                          checked={newParameter.sensitive || false}
                          onChange={(e) =>
                            setNewParameter({ ...newParameter, sensitive: e.target.checked })
                          }
                          className="w-4 h-4 rounded-sm border-gray-300"
                        />
                        <Label htmlFor="param-sensitive" className="text-sm font-normal cursor-pointer flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Sensitive
                        </Label>
                      </div>
                    </div>

                    {/* LLM Collection Configuration */}
                    <div className="pt-3 border-t dark:border-slate-800 space-y-3">
                      <Label className="text-sm font-semibold">
                        LLM Parameter Collection
                      </Label>
                      <div>
                        <Label htmlFor="llm-prompt" className="text-xs font-semibold">
                          Question to Ask User
                        </Label>
                        <Input
                          id="llm-prompt"
                          placeholder="Which city would you like weather for?"
                          value={newParameter.llm_collection?.prompt || ""}
                          onChange={(e) =>
                            setNewParameter({
                              ...newParameter,
                              llm_collection: {
                                ...newParameter.llm_collection!,
                                prompt: e.target.value,
                              },
                            })
                          }
                          className="rounded-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          What the agent asks when it needs this parameter
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="extraction-hint" className="text-xs font-semibold">
                          How to Extract from Context
                        </Label>
                        <Textarea
                          id="extraction-hint"
                          placeholder="Extract city name. Accept abbreviations (NYC→New York), handle typos, understand context."
                          value={newParameter.llm_collection?.extraction_hint || ""}
                          onChange={(e) =>
                            setNewParameter({
                              ...newParameter,
                              llm_collection: {
                                ...newParameter.llm_collection!,
                                extraction_hint: e.target.value,
                              },
                            })
                          }
                          rows={2}
                          className="rounded-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Instructions for the LLM on how to extract this parameter from conversation
                        </p>
                      </div>
                    </div>

                    {/* LLM Validation Configuration */}
                    <div className="pt-3 border-t dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          id="validation-enabled"
                          type="checkbox"
                          checked={newParameter.validation?.enabled || false}
                          onChange={(e) =>
                            setNewParameter({
                              ...newParameter,
                              validation: {
                                ...newParameter.validation!,
                                enabled: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded-sm border-gray-300"
                        />
                        <Label htmlFor="validation-enabled" className="text-sm font-semibold cursor-pointer">
                          LLM Validation (Natural language, no regex!)
                        </Label>
                      </div>
                      {newParameter.validation?.enabled && (
                        <>
                          <div>
                            <Label htmlFor="validation-instruction" className="text-xs">
                              Validation Instruction
                            </Label>
                            <Textarea
                              id="validation-instruction"
                              placeholder="Verify this is a real city name. Accept common variations."
                              value={newParameter.validation?.instruction || ""}
                              onChange={(e) =>
                                setNewParameter({
                                  ...newParameter,
                                  validation: {
                                    ...newParameter.validation!,
                                    instruction: e.target.value,
                                  },
                                })
                              }
                              rows={2}
                              className="rounded-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="max-retries" className="text-xs">Max Retries</Label>
                              <Input
                                id="max-retries"
                                type="number"
                                min="1"
                                max="10"
                                value={newParameter.validation?.max_retries || 3}
                                onChange={(e) =>
                                  setNewParameter({
                                    ...newParameter,
                                    validation: {
                                      ...newParameter.validation!,
                                      max_retries: parseInt(e.target.value),
                                    },
                                  })
                                }
                                className="rounded-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="on-invalid" className="text-xs">On Invalid</Label>
                              <Select
                                value={newParameter.validation?.on_invalid || "retry"}
                                onValueChange={(value: any) =>
                                  setNewParameter({
                                    ...newParameter,
                                    validation: {
                                      ...newParameter.validation!,
                                      on_invalid: value,
                                    },
                                  })
                                }
                              >
                                <SelectTrigger id="on-invalid" className="rounded-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="retry">Retry</SelectItem>
                                  <SelectItem value="use_default">Use Default</SelectItem>
                                  <SelectItem value="skip">Skip</SelectItem>
                                  <SelectItem value="ask_user">Ask User</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="retry-prompt" className="text-xs">Retry Prompt</Label>
                            <Input
                              id="retry-prompt"
                              placeholder="I didn't catch that. Could you specify the city again?"
                              value={newParameter.validation?.retry_prompt || ""}
                              onChange={(e) =>
                                setNewParameter({
                                  ...newParameter,
                                  validation: {
                                    ...newParameter.validation!,
                                    retry_prompt: e.target.value,
                                  },
                                })
                              }
                              className="rounded-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Confirmation Configuration */}
                    <div className="pt-3 border-t dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          id="confirmation-enabled"
                          type="checkbox"
                          checked={newParameter.confirmation?.enabled || false}
                          onChange={(e) =>
                            setNewParameter({
                              ...newParameter,
                              confirmation: {
                                ...newParameter.confirmation!,
                                enabled: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded-sm border-gray-300"
                        />
                        <Label htmlFor="confirmation-enabled" className="text-sm font-semibold cursor-pointer">
                          Confirmation & Correction
                        </Label>
                      </div>
                      {newParameter.confirmation?.enabled && (
                        <>
                          <div>
                            <Label htmlFor="confirmation-template" className="text-xs">
                              Confirmation Template
                            </Label>
                            <Input
                              id="confirmation-template"
                              placeholder="You want weather for {city}, correct?"
                              value={newParameter.confirmation?.template || ""}
                              onChange={(e) =>
                                setNewParameter({
                                  ...newParameter,
                                  confirmation: {
                                    ...newParameter.confirmation!,
                                    template: e.target.value,
                                  },
                                })
                              }
                              className="rounded-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Use {"{parameterName}"} as placeholder
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              id="allow-correction"
                              type="checkbox"
                              checked={newParameter.confirmation?.allow_correction ?? true}
                              onChange={(e) =>
                                setNewParameter({
                                  ...newParameter,
                                  confirmation: {
                                    ...newParameter.confirmation!,
                                    allow_correction: e.target.checked,
                                  },
                                })
                              }
                              className="w-4 h-4 rounded-sm border-gray-300"
                            />
                            <Label htmlFor="allow-correction" className="text-xs font-normal cursor-pointer">
                              Allow user to correct
                            </Label>
                          </div>
                          {newParameter.confirmation?.allow_correction && (
                            <>
                              <div>
                                <Label htmlFor="correction-prompt" className="text-xs">
                                  Correction Prompt
                                </Label>
                                <Input
                                  id="correction-prompt"
                                  placeholder="No problem! Which city did you mean?"
                                  value={newParameter.confirmation?.correction_prompt || ""}
                                  onChange={(e) =>
                                    setNewParameter({
                                      ...newParameter,
                                      confirmation: {
                                        ...newParameter.confirmation!,
                                        correction_prompt: e.target.value,
                                      },
                                    })
                                  }
                                  className="rounded-sm"
                                />
                              </div>
                              <div>
                                <Label htmlFor="max-corrections" className="text-xs">
                                  Max Corrections
                                </Label>
                                <Input
                                  id="max-corrections"
                                  type="number"
                                  min="1"
                                  max="5"
                                  value={newParameter.confirmation?.max_corrections || 2}
                                  onChange={(e) =>
                                    setNewParameter({
                                      ...newParameter,
                                      confirmation: {
                                        ...newParameter.confirmation!,
                                        max_corrections: parseInt(e.target.value),
                                      },
                                    })
                                  }
                                  className="rounded-sm"
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={addParameter}
                      size="sm"
                      className="w-full rounded-sm bg-[#105e6e] hover:bg-[#105e6e]/90 text-white border-0"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Parameter
                    </Button>
                  </div>
                </Card>

                {formData.parameters.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-2">
                      Click on a parameter to view/edit details
                    </p>
                    {formData.parameters.map((param, index) => {
                      const isExpanded = expandedParamIndex === index;
                      const isEditing = editingParamIndex === index;
                      const displayParam =
                        isEditing && editedParameter ? editedParameter : param;

                      return (
                        <Card key={index} className="overflow-hidden rounded-sm dark:bg-slate-900 dark:border-slate-800">
                          {/* Parameter Header - Always Visible */}
                          <div
                            className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => !isEditing && toggleParameterExpansion(index)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm font-mono text-sm dark:text-gray-200">
                                    {param.name}
                                  </code>
                                  <Badge variant="secondary" className="text-xs rounded-sm">
                                    {param.type}
                                  </Badge>
                                  {param.required && (
                                    <Badge variant="outline" className="text-xs rounded-sm">
                                      required
                                    </Badge>
                                  )}
                                  {param.copyable && (
                                    <Badge variant="outline" className="text-xs rounded-sm flex items-center gap-1">
                                      <Copy className="h-3 w-3" />
                                      copyable
                                    </Badge>
                                  )}
                                  {param.sensitive && (
                                    <Badge variant="outline" className="text-xs rounded-sm flex items-center gap-1">
                                      <Lock className="h-3 w-3" />
                                      sensitive
                                    </Badge>
                                  )}
                                </div>
                                {param.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {param.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="border-t dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 p-4 space-y-3">
                              {!isEditing ? (
                                <>
                                  {/* View Mode */}
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="font-semibold dark:text-gray-200">Description:</span>{" "}
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {param.description || "None"}
                                      </span>
                                    </div>
                                    {param.llm_collection?.prompt && (
                                      <div>
                                        <span className="font-semibold dark:text-gray-200">Question to Ask User:</span>{" "}
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {param.llm_collection.prompt}
                                        </span>
                                      </div>
                                    )}
                                    {param.llm_collection?.extraction_hint && (
                                      <div>
                                        <span className="font-semibold dark:text-gray-200">Extraction Hint:</span>{" "}
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {param.llm_collection.extraction_hint}
                                        </span>
                                      </div>
                                    )}
                                    {param.default !== undefined && (
                                      <div>
                                        <span className="font-semibold dark:text-gray-200">Default:</span>{" "}
                                        <code className="text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-slate-700 px-1 rounded-sm">
                                          {String(param.default)}
                                        </code>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingParameter(index);
                                      }}
                                      className="rounded-sm"
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete parameter "${param.name}"?`)) {
                                          removeParameter(index);
                                        }
                                      }}
                                      className="rounded-sm"
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Edit Mode */}
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-xs">Parameter Name</Label>
                                      <Input
                                        value={displayParam.name}
                                        onChange={(e) =>
                                          setEditedParameter({ ...displayParam, name: e.target.value })
                                        }
                                        className="h-8 text-sm rounded-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Description</Label>
                                      <Input
                                        value={displayParam.description || ""}
                                        onChange={(e) =>
                                          setEditedParameter({ ...displayParam, description: e.target.value })
                                        }
                                        className="h-8 text-sm rounded-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Type</Label>
                                      <Select
                                        value={displayParam.type}
                                        onValueChange={(value: any) =>
                                          setEditedParameter({ ...displayParam, type: value })
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-sm rounded-sm">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="string">String</SelectItem>
                                          <SelectItem value="number">Number</SelectItem>
                                          <SelectItem value="boolean">Boolean</SelectItem>
                                          <SelectItem value="array">Array</SelectItem>
                                          <SelectItem value="object">Object</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Question to Ask User</Label>
                                      <Input
                                        value={displayParam.llm_collection?.prompt || ""}
                                        onChange={(e) =>
                                          setEditedParameter({
                                            ...displayParam,
                                            llm_collection: {
                                              ...displayParam.llm_collection!,
                                              prompt: e.target.value,
                                            },
                                          })
                                        }
                                        className="h-8 text-sm rounded-sm"
                                        placeholder="What value should I use?"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Extraction Hint</Label>
                                      <Input
                                        value={displayParam.llm_collection?.extraction_hint || ""}
                                        onChange={(e) =>
                                          setEditedParameter({
                                            ...displayParam,
                                            llm_collection: {
                                              ...displayParam.llm_collection!,
                                              extraction_hint: e.target.value,
                                            },
                                          })
                                        }
                                        className="h-8 text-sm rounded-sm"
                                        placeholder="How to extract from context"
                                      />
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={displayParam.required}
                                          onChange={(e) =>
                                            setEditedParameter({ ...displayParam, required: e.target.checked })
                                          }
                                          className="rounded-sm"
                                        />
                                        Required
                                      </label>
                                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={displayParam.copyable}
                                          onChange={(e) =>
                                            setEditedParameter({ ...displayParam, copyable: e.target.checked })
                                          }
                                          className="rounded-sm"
                                        />
                                        Copyable
                                      </label>
                                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={displayParam.sensitive}
                                          onChange={(e) =>
                                            setEditedParameter({ ...displayParam, sensitive: e.target.checked })
                                          }
                                          className="rounded-sm"
                                        />
                                        Sensitive
                                      </label>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        saveEditedParameter();
                                      }}
                                      className="rounded-sm bg-[#105e6e] hover:bg-[#105e6e]/90 text-white border-0"
                                    >
                                      <Save className="h-3 w-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEditingParameter();
                                      }}
                                      className="rounded-sm"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Return Type</Label>
                <Select
                  value={formData.return_type}
                  onValueChange={(value) => setFormData({ ...formData, return_type: value })}
                >
                  <SelectTrigger className="mt-1 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                    <SelectItem value="dict">Dictionary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timeout (seconds)</Label>
                <Input
                  type="number"
                  min="1"
                  max="300"
                  value={formData.timeout_seconds}
                  onChange={(e) =>
                    setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) })
                  }
                  className="mt-1 rounded-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex-none bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/capabilities")}
            className="rounded-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateCapability}
            disabled={isSaving || !formData.name.trim() || !formData.code.trim()}
            className="rounded-sm bg-[#105e6e] hover:bg-[#105e6e]/90 text-white border-0"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Capability"
            )}
          </Button>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col rounded-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-[#105e6e]" />
              Import Capability from JSON
            </DialogTitle>
            <DialogDescription>
              Upload a JSON file or paste JSON content to quickly create a capability
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={importMethod}
            onValueChange={(v) => setImportMethod(v as any)}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-sm">
              <TabsTrigger value="paste" className="rounded-sm">Paste JSON</TabsTrigger>
              <TabsTrigger value="upload" className="rounded-sm">Upload File</TabsTrigger>
            </TabsList>
            <TabsContent value="paste" className="flex-1 flex flex-col mt-4">
              <Textarea
                placeholder="Paste JSON configuration here..."
                className="flex-1 min-h-[300px] font-mono text-sm rounded-sm"
                value={importJSON}
                onChange={(e) => setImportJSON(e.target.value)}
              />
            </TabsContent>
            <TabsContent
              value="upload"
              className="flex-1 flex items-center justify-center mt-4 border-2 border-dashed rounded-sm p-12"
            >
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-sm bg-white dark:bg-slate-900 font-semibold text-[#105e6e] hover:text-[#105e6e]/80"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".json"
                      className="sr-only"
                      onChange={handleFileImport}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600 mt-2">JSON files only</p>
                {importJSON && (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400 rounded-sm flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700">
                    <Check className="h-4 w-4" />
                    Valid JSON loaded
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              className="rounded-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportFromJSON}
              disabled={!importJSON}
              className="rounded-sm bg-[#105e6e] hover:bg-[#105e6e]/90 text-white border-0"
            >
              Import Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}