import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Code,
  Settings,
  Play,
  Edit,
  Trash2,
  Copy,
  Check,
  Terminal,
  FileCode,
  Lock,
  Globe,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Capability, CapabilityParameter } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import Editor from "@monaco-editor/react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function CapabilityDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const capabilityId = params.id as string;

  const [capability, setCapability] = useState<Capability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"parameters" | "code">(
    "parameters",
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [executionParams, setExecutionParams] = useState<Record<string, any>>(
    {},
  );
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth/login");
      return;
    }
    loadCapability();
  }, [user, authLoading, navigate, capabilityId]);

  const loadCapability = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getCapability(capabilityId);

      if (response.success && response.data) {
        setCapability(response.data.capability);

        // Initialize execution params with defaults
        const initialParams: Record<string, any> = {};
        response.data.capability.parameters.forEach(
          (param: CapabilityParameter) => {
            initialParams[param.name] = param.default || "";
          },
        );
        setExecutionParams(initialParams);
      }
    } catch (error) {
      console.error("Failed to load capability:", error);
      toast({
        title: "Error",
        description: "Failed to load capability",
        variant: "destructive",
        duration: 2000
      });
      navigate("/capabilities");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied",
        description: `${fieldName} copied to clipboard`,
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const handleExecuteCapability = async () => {
    if (!capability) return;

    try {
      setIsExecuting(true);
      const response = await apiClient.executeCapability(
        capability.id,
        executionParams,
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

  const handleDelete = async () => {
    if (
      !capability ||
      !confirm("Are you sure you want to delete this capability?")
    )
      return;

    try {
      const response = await apiClient.deleteCapability(capability.id, false);

      if (response.success) {
        toast({
          title: "Success",
          description: "Capability deleted successfully",
          duration: 2000
        });
        navigate("/capabilities");
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

  const toggleSensitiveVisibility = (paramName: string) => {
    setShowSensitive((prev) => ({
      ...prev,
      [paramName]: !prev[paramName],
    }));
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#edf2f7]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 mb-4 border-4 border-gray-200 rounded-full border-t-gray-600 animate-spin" />
          <p className="text-gray-600 dark:text-[#EEF2F7]">Loading Capability...</p>
        </div>
      </div>
    );
  }

  if (!capability) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#edf2f7]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="mb-2 text-lg font-semibold">
                Capability Not Found
              </h3>
              <p className="mb-4 text-gray-600 dark:text-[#EEF2F7]">
                The capability you're looking for doesn't exist or has been
                deleted.
              </p>
              <Button onClick={() => navigate("/capabilities")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Capabilities
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#edf2f7] dark:bg-[#0d1117]">
      <div className="flex-1">
        {/* ── Header Section - Exact Data Hub Style ── */}
        <div className="max-w-6xl mx-auto w-full">
          <div className="relative overflow-hidden px-6 py-8 transition-all duration-300">
            <div className="relative z-10">
              <div className="mb-2">
                <Breadcrumbs />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-200">
                      {capability.name}
                    </h1>
                    <Badge
                      variant={
                        capability.status === "active" ? "default" : "secondary"
                      }
                    >
                      {capability.status}
                    </Badge>
                    {capability.is_global && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Global
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium mb-4">
                    {capability.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-[#EEF2F7] flex-wrap">
                    <div className="flex items-center gap-1">
                      <Code className="w-4 h-4" />
                      {capability.category}
                    </div>
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      {capability.usage_count} executions
                    </div>
                    <div>Created {formatRelativeTime(capability.created_at)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    className="h-10 px-4 font-medium"
                    onClick={() => navigate(`/capabilities/${capability.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2 text-slate-500" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 px-4 font-medium"
                    onClick={handleExecuteCapability}
                    disabled={isExecuting}
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2 text-emerald-500" />
                        Execute
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-10 px-4 font-semibold shadow-sm bg-red-600 hover:bg-red-700"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Tags row */}
              {capability.tags && capability.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {capability.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="p-6 mx-auto max-w-6xl">

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="space-y-6"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger
                value="parameters"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Parameters
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Raw Code
              </TabsTrigger>
            </TabsList>

            {/* Parameters Tab */}
            <TabsContent value="parameters" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Capability Parameters</CardTitle>
                  <CardDescription>
                    Configure input parameters for this capability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {capability.parameters.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      <Settings className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No parameters defined for this capability</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {capability.parameters.map((param, index) => (
                        <Card
                          key={index}
                          className="rounded-md border border-slate-200 dark:border-[#323942] transition-all duration-200 bg-gray-100 dark:bg-[#0f1825] overflow-hidden"
                        >
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              {/* Parameter Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <code className="px-2 py-1 font-mono text-sm font-semibold bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-400 rounded">
                                      {param.name}
                                    </code>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {param.type}
                                    </Badge>
                                    {param.required && (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        Required
                                      </Badge>
                                    )}
                                    {param.copyable && (
                                      <Badge
                                        variant="outline"
                                        className="flex items-center gap-1 text-xs"
                                      >
                                        <Copy className="w-3 h-3" />
                                        Copyable
                                      </Badge>
                                    )}
                                    {param.sensitive && (
                                      <Badge
                                        variant="outline"
                                        className="flex items-center gap-1 text-xs"
                                      >
                                        <Lock className="w-3 h-3" />
                                        Sensitive
                                      </Badge>
                                    )}
                                  </div>
                                  {param.description && (
                                    <p className="text-sm text-gray-600 dark:text-[#EEF2F7] ">
                                      {param.description}
                                    </p>
                                  )}
                                </div>
                                {param.copyable && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleCopyToClipboard(
                                        executionParams[param.name] ||
                                        param.default ||
                                        "",
                                        param.name,
                                      )
                                    }
                                  >
                                    {copiedField === param.name ? (
                                      <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                              </div>

                              {/* Parameter Input */}
                              <div>
                                <Label
                                  htmlFor={`param-${param.name}`}
                                  className="text-xs text-gray-500"
                                >
                                  Value
                                </Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Input
                                      id={`param-${param.name}`}
                                      type={
                                        param.sensitive &&
                                          !showSensitive[param.name]
                                          ? "password"
                                          : "text"
                                      }
                                      value={executionParams[param.name] || ""}
                                      onChange={(e) =>
                                        setExecutionParams({
                                          ...executionParams,
                                          [param.name]: e.target.value,
                                        })
                                      }
                                      placeholder={
                                        param.default
                                          ? `Default: ${param.default}`
                                          : `Enter ${param.name}`
                                      }
                                      className="flex-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-sm"
                                    />
                                  {param.sensitive && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        toggleSensitiveVisibility(param.name)
                                      }
                                    >
                                      {showSensitive[param.name] ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* API Configuration */}
                              {param.api_config && (
                                <div className="p-4 space-y-3 border border-slate-200/60 dark:border-slate-800/60 rounded-sm bg-slate-100 dark:bg-slate-900/50">
                                  <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                                    <Globe className="w-4 h-4" />
                                    API Configuration
                                  </h4>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    {param.api_config.endpoint && (
                                      <div>
                                        <Label className="text-xs text-slate-500 dark:text-slate-400">
                                          Endpoint
                                        </Label>
                                        <code className="block p-2 mt-1 text-xs bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-sm">
                                          {param.api_config.endpoint}
                                        </code>
                                      </div>
                                    )}
                                    {param.api_config.method && (
                                      <div>
                                        <Label className="text-xs text-blue-700">
                                          Method
                                        </Label>
                                        <Badge
                                          variant="outline"
                                          className="mt-1"
                                        >
                                          {param.api_config.method}
                                        </Badge>
                                      </div>
                                    )}
                                    {param.api_config.auth_type && (
                                      <div>
                                        <Label className="text-xs text-blue-700">
                                          Auth Type
                                        </Label>
                                        <Badge
                                          variant="outline"
                                          className="mt-1"
                                        >
                                          {param.api_config.auth_type}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  {param.api_config.headers &&
                                    Object.keys(param.api_config.headers)
                                      .length > 0 && (
                                      <div>
                                        <Label className="text-xs text-slate-500 dark:text-slate-400">
                                          Headers
                                        </Label>
                                        <pre className="p-2 mt-1 overflow-x-auto text-xs bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-sm">
                                          {JSON.stringify(
                                            param.api_config.headers,
                                            null,
                                            2,
                                          )}
                                        </pre>
                                      </div>
                                    )}
                                  {param.api_config.payload &&
                                    Object.keys(param.api_config.payload)
                                      .length > 0 && (
                                      <div>
                                        <Label className="text-xs text-slate-500 dark:text-slate-400">
                                          Payload
                                        </Label>
                                        <pre className="p-2 mt-1 overflow-x-auto text-xs bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 rounded-sm">
                                          {JSON.stringify(
                                            param.api_config.payload,
                                            null,
                                            2,
                                          )}
                                        </pre>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Execution Result */}
              {executionResult && (
                <Alert
                  className={
                    executionResult.success
                      ? "border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-500/20 dark:bg-emerald-500/5"
                      : "border-red-500/20 bg-red-500/5 dark:border-red-500/20 dark:bg-red-500/5"
                  }
                >
                  <Terminal className="w-4 h-4" />
                  <AlertDescription>
                    <div className="font-mono text-sm">
                      {executionResult.success ? (
                        <>
                          <p className="mb-2 font-semibold text-green-800">
                            Result:
                          </p>
                          <pre className="overflow-x-auto text-green-700">
                            {JSON.stringify(executionResult.result, null, 2)}
                          </pre>
                          {executionResult.print_output && (
                            <>
                              <p className="mt-3 mb-1 font-semibold text-green-800">
                                Output:
                              </p>
                              <pre className="text-green-700">
                                {executionResult.print_output}
                              </pre>
                            </>
                          )}
                          <p className="mt-2 text-xs text-green-600">
                            Executed in {executionResult.execution_time_ms}ms
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="mb-2 font-semibold text-red-800">
                            Error:
                          </p>
                          <pre className="text-red-700">
                            {executionResult.error}
                          </pre>
                        </>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Raw Code Tab */}
            <TabsContent value="code">
              <Card>
                <CardHeader>
                  <CardTitle>Raw Code</CardTitle>
                  <CardDescription>
                    View the Python code that powers this capability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden border rounded-lg overflow-y-auto max-h-[300px]">
                    <Editor
                      height="300px"
                      defaultLanguage="python"
                      theme="vs-dark"
                      value={capability.code}
                      options={{
                        readOnly: true,
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div>
                        Return Type:{" "}
                        <code className="bg-gray-100 px-2 py-0.5 rounded">
                          {capability.return_type}
                        </code>
                      </div>
                      <div>Timeout: {capability.timeout_seconds}s</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopyToClipboard(capability.code, "Code")
                      }
                    >
                      {copiedField === "Code" ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
