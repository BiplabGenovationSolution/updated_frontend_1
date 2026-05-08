"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Code2, GitBranch, FolderGit2, CheckCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function CreateCodebasePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [repoType, setRepoType] = useState<"git" | "local" | "scratch">("git");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoName, setRepoName] = useState("");
  const [maxFiles, setMaxFiles] = useState("100");
  const [authType, setAuthType] = useState<"none" | "token">("none");
  const [authToken, setAuthToken] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createCodebaseMutation = useMutation({
    mutationFn: (data: any) => apiClient.createCodebase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codebases"] });
      toast({ title: "Success", description: "Codebase created and indexed successfully", duration: 2000 });
      navigate("/hub?tab=codebases");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create codebase", variant: "destructive", duration: 2000 });
    },
  });

  const createScratchMutation = useMutation({
    mutationFn: (displayName: string) => apiClient.createScratchCodebase(displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codebases"] });
      toast({ title: "Success", description: "Empty codebase created. You can now start building with Clavis.", duration: 2000 });
      navigate("/hub?tab=codebases");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create codebase", variant: "destructive", duration: 2000 });
    },
  });

  const isPending = createCodebaseMutation.isPending || createScratchMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoType === "scratch") {
      createScratchMutation.mutate(repoName);
    } else if (repoType === "local") {
      if (!selectedFile) {
        toast({ title: "Error", description: "Please select a ZIP file to upload", variant: "destructive" });
        return;
      }
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("display_name", repoName);
      formData.append("max_files", maxFiles);
      createCodebaseMutation.mutate({ type: "folder", data: formData });
    } else {
      const data: any = {
        repo_url: repoUrl,
        repo_name: repoName,
        max_files: parseInt(maxFiles),
        auth_type: authType,
      };
      if (authType === "token" && authToken) data.auth_token = authToken;
      createCodebaseMutation.mutate({ type: "git", data });
    }
  };

  const isValid =
    repoType === "scratch"
      ? !!repoName
      : repoType === "local"
      ? selectedFile && repoName && parseInt(maxFiles) > 0
      : repoUrl && repoName && parseInt(maxFiles) > 0;

  return (
    <div className="min-h-full bg-[#EEF2F7] dark:bg-[#0d1117]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Breadcrumbs />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-200">Add Codebase</h1>
            <Badge className="bg-[#105e6e] text-white uppercase tracking-tighter border-0 h-4 px-1.5 text-[9px]">Clavis</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 italic">Connect a Git repository, upload local code, or start a blank project</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Source Type */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <Label className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-3">
              Source Type
            </Label>
            <RadioGroup value={repoType} onValueChange={(value: any) => setRepoType(value)}>
              <div className="grid grid-cols-3 gap-3">
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                  repoType === "scratch"
                    ? "border-[#105e6e] bg-teal-50 dark:bg-teal-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                )}>
                  <RadioGroupItem value="scratch" id="scratch" />
                  <Label htmlFor="scratch" className="flex items-center gap-2 cursor-pointer flex-1 text-sm dark:text-slate-200">
                    From Scratch
                  </Label>
                </div>
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                  repoType === "git"
                    ? "border-[#105e6e] bg-teal-50 dark:bg-teal-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                )}>
                  <RadioGroupItem value="git" id="git" />
                  <Label htmlFor="git" className="flex items-center gap-2 cursor-pointer flex-1 text-sm dark:text-slate-200">
                    <GitBranch className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    Git Repo
                  </Label>
                </div>
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                  repoType === "local"
                    ? "border-[#105e6e] bg-teal-50 dark:bg-teal-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                )}>
                  <RadioGroupItem value="local" id="local" />
                  <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer flex-1 text-sm dark:text-slate-200">
                    <FolderGit2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    Local Folder
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </Card>

          {/* Fields Card */}
          <Card className="bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            {/* ZIP Upload (local) */}
            {repoType === "local" && (
              <div>
                <Label htmlFor="file-upload" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-2">
                  Upload ZIP File *
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      if (!repoName) setRepoName(file.name.replace(".zip", ""));
                    }
                  }}
                  disabled={isPending}
                  className="cursor-pointer bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                {selectedFile && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload a ZIP file containing your project source code</p>
              </div>
            )}

            {/* Repo URL (git) */}
            {repoType === "git" && (
              <div>
                <Label htmlFor="repo-url" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-2">
                  Repository URL *
                </Label>
                <Input
                  id="repo-url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repository.git"
                  disabled={isPending}
                  className="bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be a public Git repository or provide access token</p>
              </div>
            )}

            {/* Display Name */}
            <div>
              <Label htmlFor="repo-name" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-2">
                {repoType === "scratch" ? "Project Name *" : "Display Name *"}
              </Label>
              <Input
                id="repo-name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder={repoType === "scratch" ? "e.g., my-new-app" : "e.g., my-awesome-project"}
                disabled={isPending}
                className="bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            {/* Max Files (git and local) */}
            {repoType !== "scratch" && (
              <div>
                <Label htmlFor="max-files" className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-2">
                  Maximum Files to Index
                </Label>
                <Input
                  id="max-files"
                  type="number"
                  value={maxFiles}
                  onChange={(e) => setMaxFiles(e.target.value)}
                  min="1"
                  max="1000"
                  disabled={isPending}
                  className="bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Limit: 1-1000 files (larger codebases may take longer to process)</p>
              </div>
            )}

            {/* Authentication (git) */}
            {repoType === "git" && (
              <div>
                <Label className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-tight opacity-70 block mb-3">
                  Authentication
                </Label>
                <RadioGroup value={authType} onValueChange={(value: any) => setAuthType(value)}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/30 cursor-pointer">
                      <RadioGroupItem value="none" id="auth-none" />
                      <Label htmlFor="auth-none" className="cursor-pointer flex-1 text-sm dark:text-slate-200">Public Repository (No Auth)</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/30 cursor-pointer">
                      <RadioGroupItem value="token" id="auth-token" />
                      <Label htmlFor="auth-token" className="cursor-pointer flex-1 text-sm dark:text-slate-200">Private Repository (Access Token)</Label>
                    </div>
                  </div>
                </RadioGroup>
                {authType === "token" && (
                  <div className="mt-3">
                    <Input
                      type="password"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      disabled={isPending}
                      className="bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">GitHub Personal Access Token with repo access</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Info Alert */}
          <Alert className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
            <Code2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <AlertDescription className="text-sm text-teal-800 dark:text-teal-300">
              <div className="space-y-1">
                {repoType === "scratch" ? (
                  <>
                    <p className="font-medium">Start with a blank canvas:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      <li>Create an empty project workspace</li>
                      <li>Build your application from the ground up</li>
                      <li>Let Clavis AI help you write code from scratch</li>
                      <li>Launch a dev pod to start coding immediately</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Clavis will automatically:</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      {repoType === "git" ? (
                        <>
                          <li>Clone and analyze your codebase</li>
                          <li>Index all supported file types</li>
                          <li>Create searchable code chunks</li>
                          <li>Enable semantic code search</li>
                        </>
                      ) : (
                        <>
                          <li>Extract and analyze your ZIP file</li>
                          <li>Index all supported file types</li>
                          <li>Create searchable code chunks</li>
                          <li>Enable semantic code search</li>
                        </>
                      )}
                    </ul>
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/hub?tab=codebases")}
              disabled={isPending}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isPending}
              className="bg-[#105e6e] hover:bg-[#0d4d59] text-white min-w-[160px] font-bold uppercase text-xs tracking-widest"
            >
              {isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />{repoType === "scratch" ? "Creating Project..." : "Creating & Indexing..."}</>
              ) : (
                <><CheckCircle className="h-3.5 w-3.5 mr-2" />{repoType === "scratch" ? "Create Project" : "Create Codebase"}</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
