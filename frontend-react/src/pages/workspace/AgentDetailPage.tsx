import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Bot, 
  ChevronLeft, 
  Settings, 
  Terminal, 
  Zap, 
  MessageSquare, 
  Activity, 
  Calendar,
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/lib/api";
import type { CustomAgent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

export default function AgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<CustomAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("config");

  useEffect(() => {
    const loadAgent = async () => {
      if (!agentId) return;
      try {
        setLoading(true);
        const response = await apiClient.getCustomAgent(agentId);
        if (response.success && response.data) {
          // Compatibility with different API response structures
          const agentData = response.data.agent || response.data;
          setAgent(agentData);
        }
      } catch (error) {
        console.error("Failed to load agent:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAgent();
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[#0d1117]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[#0d1117]">
        <h2 className="text-xl font-bold dark:text-white">Agent not found</h2>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-[#0d1117]">
      <div className="flex-1">
        
        {/* Header Section */}
        <div className="max-w-6xl mx-auto w-full px-6 pt-8 pb-4">
          <div className="flex flex-col gap-6">
            
            {/* Breadcrumb & Global Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <button 
                  onClick={() => navigate("/agents")}
                  className="hover:text-blue-500 transition-colors"
                >
                  Agents
                </button>
                <ChevronLeft className="w-3 h-3 rotate-180" />
                <span className="text-slate-900 dark:text-slate-100 font-medium">{agent.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-md border-slate-200 dark:border-[#323942] dark:bg-[#0f1825] dark:text-slate-300"
                  onClick={() => navigate(`/agents/${agent.id}/edit`)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Agent
                </Button>
                <Button 
                  size="sm"
                  className="rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate(`/agents/${agent.id}`)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Chat
                </Button>
              </div>
            </div>

            {/* Title & Stats Grid */}
            <div className="flex items-start justify-between gap-8 flex-wrap">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center border border-blue-600/20">
                  <span className="text-3xl">{agent.emoji || '🤖'}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{agent.name}</h1>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xl text-sm leading-relaxed">
                    {agent.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-grow md:flex-grow-0">
                {[
                  { label: "Status", value: "Ready", sub: "Active", icon: Activity, color: "text-emerald-500" },
                  { label: "Created", value: formatRelativeTime(agent.created_at || new Date().toISOString()), sub: "Timeline", icon: Calendar, color: "text-blue-500" },
                  { label: "Model", value: agent.model_id?.split('/').pop() || "GPT-4o", sub: "Engine", icon: Layers, color: "text-amber-500" },
                  { label: "Capabilities", value: (agent.capabilities || []).length, sub: "Modules", icon: Zap, color: "text-indigo-500" },
                ].map((stat, i) => (
                  <div key={i} className="px-4 py-3 rounded-md border border-slate-200 dark:border-[#323942] bg-white dark:bg-[#0f1825]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{stat.value}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-500">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 mx-auto max-w-6xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-transparent border-b border-slate-200 dark:border-[#2a3358] w-full justify-start rounded-none h-auto p-0 gap-8">
              <TabsTrigger 
                value="config" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-0 pb-4 text-sm font-medium"
              >
                Configuration
              </TabsTrigger>
              <TabsTrigger 
                value="prompt" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-0 pb-4 text-sm font-medium"
              >
                System Prompt
              </TabsTrigger>
              <TabsTrigger 
                value="capabilities" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-0 pb-4 text-sm font-medium"
              >
                Capabilities & Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="mt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="rounded-md border-slate-200 dark:border-[#323942] bg-white dark:bg-[#0f1825]">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Model Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-[#2a3358]">
                        <span className="text-sm text-slate-500">Provider</span>
                        <span className="text-sm font-medium dark:text-white">OpenAI / Custom</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-[#2a3358]">
                        <span className="text-sm text-slate-500">Temperature</span>
                        <span className="text-sm font-medium dark:text-white">{agent.configuration?.temperature || 0.7}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-[#2a3358]">
                        <span className="text-sm text-slate-500">Max Tokens</span>
                        <span className="text-sm font-medium dark:text-white">{agent.configuration?.max_tokens || 2048}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-md border-slate-200 dark:border-[#323942] bg-white dark:bg-[#0f1825]">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-500" />
                        Integration Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-[#2a3358]">
                        <span className="text-sm text-slate-500">Interface Type</span>
                        <Badge variant="outline" className="capitalize">{agent.interface_type || 'Chat'}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-[#2a3358]">
                        <span className="text-sm text-slate-500">Visibility</span>
                        <Badge variant="outline" className="capitalize text-blue-500 border-blue-500/20 bg-blue-500/5">{agent.visibility || 'Private'}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-slate-500">Created At</span>
                        <span className="text-sm font-medium dark:text-white">{new Date(agent.created_at || '').toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
               </div>
            </TabsContent>

            <TabsContent value="prompt" className="mt-0">
              <Card className="rounded-md border-slate-200 dark:border-[#323942] bg-white dark:bg-[#0f1825] overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-[#2a3358] bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-500" />
                      Primary System Instructions
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 font-mono text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-[#0f1825]">
                    {agent.system_prompt || "No system prompt configured."}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="capabilities" className="mt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(agent.capabilities || []).length > 0 ? (
                    agent.capabilities.map((cap, i) => (
                      <Card 
                        key={i} 
                        className="rounded-md border-slate-200 dark:border-[#323942] transition-all duration-200 bg-white dark:bg-[#0f1825] hover:border-blue-500 dark:hover:border-blue-500 group"
                      >
                        <CardContent className="p-5 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">
                              {cap.name || "Unnamed Capability"}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              Enabled functional module for this agent.
                            </p>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-[10px] text-blue-500 font-bold mt-2 hover:no-underline"
                              onClick={() => navigate(`/capabilities/${cap.id || cap.capability_id}`)}
                            >
                              VIEW MODULE <ArrowRight className="w-2.5 h-2.5 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-[#323942] rounded-md">
                      <Zap className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm italic">No custom capabilities attached to this agent.</p>
                    </div>
                  )}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
