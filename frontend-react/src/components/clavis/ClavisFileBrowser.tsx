import React, { useState, useEffect, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Folder, File, FileCode, FileJson, FileText, Image as ImageIcon, RefreshCw, Loader2, ChevronRight, ArrowLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clavisAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeProvider';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

interface ClavisFileBrowserProps {
  sessionId: string;
  onFileSelect?: (path: string) => void;
  className?: string;
  refreshTrigger?: number; // External trigger to refresh file list
}

export const ClavisFileBrowser: React.FC<ClavisFileBrowserProps> = ({
  sessionId,
  onFileSelect,
  className,
  refreshTrigger = 0
}) => {
  const { resolvedTheme } = useTheme();
  const [currentPath, setCurrentPath] = useState('/workspace');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchFiles = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await clavisAPI.getPodFiles(sessionId, path);
      if (response.success) {
        // Map backend fields and sort: directories first, then alphabetical
        const mappedFiles: FileItem[] = (response.data.files || []).map((f: any) => ({
          name: f.name,
          path: f.path,
          type: f.is_dir ? 'directory' : 'file',
          size: f.size
        }));

        const sortedFiles = mappedFiles.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'directory' ? -1 : 1;
        });
        setFiles(sortedFiles);
        setCurrentPath(path);
      } else {
        setError(response.error || 'Failed to fetch files');
      }
    } catch (err) {
      setError('An error occurred while fetching files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchFileContent = async (path: string) => {
    setLoadingContent(true);
    setSelectedFile(path);
    try {
      const response = await clavisAPI.getPodFile(sessionId, path);
      if (response.success) {
        setFileContent(response.data.content || '');
        if (onFileSelect) onFileSelect(path);
      } else {
        setFileContent(`Error: ${response.error || 'Failed to load file content'}`);
      }
    } catch (err) {
      setFileContent('Error: An error occurred while loading file content');
      console.error(err);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    fetchFiles(currentPath);
  }, [sessionId, refreshTrigger]);

  const handleNavigate = (item: FileItem) => {
    if (item.type === 'directory') {
      fetchFiles(item.path);
    } else {
      fetchFileContent(item.path);
    }
  };

  const handleNavigateUp = () => {
    if (currentPath === '/' || currentPath === '/workspace') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parentPath = '/' + parts.join('/');
    fetchFiles(parentPath || '/');
  };

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx': return 'javascript';
      case 'ts':
      case 'tsx': return 'typescript';
      case 'py': return 'python';
      case 'json': return 'json';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'md': return 'markdown';
      case 'sh': return 'bash';
      case 'yaml':
      case 'yml': return 'yaml';
      default: return 'text';
    }
  };

  const getFileIcon = (item: FileItem) => {
    if (item.type === 'directory') return <Folder className="h-4 w-4 text-blue-500 fill-blue-500/10" />;

    const ext = item.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json': return <FileJson className="h-4 w-4 text-yellow-500" />;
      case 'js':
      case 'ts':
      case 'tsx':
      case 'jsx':
      case 'py':
      case 'html':
      case 'css':
        return <FileCode className="h-4 w-4 text-green-500" />;
      case 'md':
      case 'txt':
        return <FileText className="h-4 w-4 text-slate-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <ImageIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4 text-slate-400" />;
    }
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <div className={cn("flex flex-col h-full bg-background dark:bg-[#0d1117] border border-border dark:border-[#30363d] rounded-lg overflow-hidden transition-colors", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-[#161b22] border-b border-border dark:border-[#30363d] shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <Folder className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-300 truncate">File Browser</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#21262d]"
          onClick={() => fetchFiles(currentPath)}
          disabled={loading}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / List */}
        <div className="w-64 border-r border-border dark:border-[#30363d] flex flex-col shrink-0 bg-background dark:bg-[#0d1117]">
          <div className="p-4 border-b border-border dark:border-[#30363d] flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Path</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#21262d] border-border dark:border-[#30363d] hover:bg-slate-100 dark:hover:bg-[#30363d] hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1.5"
                onClick={handleNavigateUp}
                disabled={loading || currentPath === '/' || currentPath === '/workspace' || currentPath.endsWith('/workspace') || currentPath.endsWith('/workspace/')}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">{currentPath}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-minimal">
            {loading && files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <span className="text-xs">Loading...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-xs text-red-500 lowercase">
                {error}
              </div>
            ) : (
              <div className="py-1">
                {files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => handleNavigate(file)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-[#21262d] group",
                      selectedFile === file.path
                        ? "bg-slate-200 dark:bg-slate-500/10 text-slate-900 dark:text-[#8b949e] font-medium"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                    )}
                  >
                    {getFileIcon(file)}
                    <span className="truncate flex-1">{file.name}</span>
                    {file.type === 'directory' && (
                      <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400" />
                    )}
                  </button>
                ))}
                {files.length === 0 && !loading && (
                  <div className="p-8 text-center text-slate-400 italic text-xs">
                    Empty directory
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background dark:bg-[#0d1117]">
          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-700 italic">
              <File className="h-10 w-10 mb-2 opacity-20" />
              <span className="text-sm">Select a file to preview</span>
            </div>
          ) : loadingContent ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-slate-600 opacity-50" />
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="px-4 py-1.5 bg-slate-50 dark:bg-black text-slate-500 dark:text-slate-400 text-[10px] font-mono border-b border-border dark:border-[#30363d] flex justify-between items-center">
                <span className="truncate">{selectedFile}</span>
              </div>
              <div className="flex-1 overflow-auto scrollbar-minimal relative group">
                <SyntaxHighlighter
                  language={getLanguage(selectedFile)}
                  style={isDark ? vscDarkPlus : oneLight}
                  customStyle={{
                    margin: 0,
                    padding: '1.25rem',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    backgroundColor: 'transparent',
                    height: '100%',
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: 'JetBrains Mono, Fira Code, Menlo, Monaco, monospace',
                    }
                  }}
                  showLineNumbers={true}
                  lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: isDark ? '#5c6370' : '#a0a1a7', textAlign: 'right', fontSize: '11px', opacity: 0.5 }}
                  wrapLines={true}
                  wrapLongLines={true}
                >
                  {fileContent}
                </SyntaxHighlighter>

                {/* Copy Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute bottom-4 right-4 h-8 w-8 bg-white/80 dark:bg-[#21262d]/80 hover:bg-slate-100 dark:hover:bg-[#30363d] border border-border dark:border-[#30363d] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all opacity-0 group-hover:opacity-100 shadow-md",
                    copied && "text-emerald-600 dark:text-emerald-500 border-emerald-500/50 opacity-100 bg-emerald-50 dark:bg-emerald-500/10"
                  )}
                  onClick={handleCopy}
                  title="Copy Code"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
