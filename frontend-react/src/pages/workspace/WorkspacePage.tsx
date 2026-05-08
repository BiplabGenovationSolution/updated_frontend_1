import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
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
  Search,
  Bot,
  Code,
  Plus,
  Sparkles,
  List,
  LayoutGrid,
  Edit,
  Trash2,
  Zap,
  MessageSquare,
  AlertCircle,
  Check,
  X,
  Loader2,
  TestTube,
  Upload,
  Download,
  FileJson,
  Terminal,
  GitBranch,
  Layout,
  ChevronLeft,
  ChevronRight,
  Activity,
  Settings,
  TrendingDown,
  Shield,
  Target,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  CustomAgent,
  Capability,
  AgentCapability,
  ExampleQuery,
} from "@/lib/types";
import { formatRelativeTime, cn } from "@/lib/utils";
import Avatar from "boring-avatars";
import { FlowCanvas, NodeSelector, NodeConfigPanel, AgentConfigSidebar } from "@/components/flows";
import type { SidebarSection } from "@/components/flows";
import type { FlowNode as FlowNodeType, FlowEdge } from "@/lib/flow-types";
import { InterfaceConfigurator } from "@/components/InterfaceConfigurator";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

function WorkspacePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [builtInAgents, setBuiltInAgents] = useState<any[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy] = useState<"recent" | "name">("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<
    CustomAgent | Capability | null
  >(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Custom agent creation/editing state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFlowBuilderOpen, setIsFlowBuilderOpen] = useState(false); // Separate modal for flow builder
  const [isFlowOnlyMode, setIsFlowOnlyMode] = useState(false); // Deprecated but kept for compatibility during refactor
  const [activeSidebarSection, setActiveSidebarSection] = useState<SidebarSection>('flow'); // Active sidebar section
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Sidebar collapse state
  const [selectedAgent, setSelectedAgent] = useState<CustomAgent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null); // Track which agent is being loaded for editing

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    emoji: "",
    agent_type: "chat" as "chat" | "flow",
    model_id: undefined as string | undefined,
    fallback_model_ids: [] as string[],
    system_prompt: "",
    initial_message: "",
    interface_type: "chat" as "chat" | "form" | "json" | "api" | "wizard",
    interface_config: {} as Record<string, any>,
    tags: [] as string[],
    visibility: "private" as "private" | "public" | "shared",
    configuration: {
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop_sequences: [],
    },
    example_queries: [] as ExampleQuery[],
    capabilities: [] as AgentCapability[],
  });

  // Available models for selection
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  const [newTag, setNewTag] = useState("");
  const [newExampleQuery, setNewExampleQuery] = useState({
    query: "",
    expected_response: "",
    description: "",
  });

  // Flow builder state
  const [flowNodes, setFlowNodes] = useState<FlowNodeType[]>([]);
  const [flowEdges, setFlowEdges] = useState<FlowEdge[]>([]);
  const [selectedFlowNode, setSelectedFlowNode] = useState<FlowNodeType | null>(
    null,
  );
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);

  // Node selector state (for n8n-style UX)
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  const [nodeSelectorPosition, setNodeSelectorPosition] = useState<{ x: number, y: number } | null>(null);
  const [nodeSelectorSourceNode, setNodeSelectorSourceNode] = useState<string | null>(null);


  // Avatar selection state
  const [selectedAvatar, setSelectedAvatar] = useState({
    variant: "beam",
    seed: "",
    colors: ["#a855f7", "#ec4899", "#ffffff"],
  });
  const [avatarOptions, setAvatarOptions] = useState<
    Array<{ variant: string; seed: string; colors: string[] }>
  >([]);

  // Import dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importJSON, setImportJSON] = useState("");
  const [importMethod, setImportMethod] = useState<"paste" | "upload">("paste");

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    type: "agent" | "capability";
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const avatarVariants = [
    "beam",
    "marble",
    "pixel",
    "sunset",
    "ring",
    "bauhaus",
  ];
  const colorSchemes = [
    ["#a855f7", "#ec4899", "#ffffff"], // purple-pink
    ["#10b981", "#06b6d4", "#ffffff"], // emerald-cyan
    ["#f59e0b", "#ef4444", "#ffffff"], // orange-red
    ["#3b82f6", "#8b5cf6", "#ffffff"], // blue-purple
    ["#14b8a6", "#06b6d4", "#ffffff"], // teal-cyan
    ["#f97316", "#dc2626", "#ffffff"], // orange-red
    ["#6366f1", "#a855f7", "#ffffff"], // indigo-purple
    ["#22d3ee", "#0891b2", "#ffffff"], // cyan-cyan
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth/login");
      return;
    }
    loadWorkspaceItems();
    loadAvailableModels();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory]);

  const getAgentRole = (id: string): string => {
    const roles: Record<string, string> = {
      aegis: "Research Intelligence",
      sophia: "Knowledge Intelligence",
      clavis: "Vision Intelligence",
      analytica: "Data Intelligence",
    };
    return roles[id.toLowerCase()] || "AI Assistant";
  };

  const getAgentIcon = (id: string) => {
    switch (id.toLowerCase()) {
      case "aegis": return Shield;
      case "sophia": return Target;
      case "clavis": return Eye;
      case "analytica": return Activity;
      default: return Bot;
    }
  };

  const generateAvatarOptions = () => {
    const options = [];
    for (let i = 0; i < 10; i++) {
      const variant =
        avatarVariants[Math.floor(Math.random() * avatarVariants.length)];
      const colors =
        colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
      const seed = `${Date.now()}-${Math.random()}`;
      options.push({ variant, seed, colors });
    }
    setAvatarOptions(options);
    if (options.length > 0 && !selectedAvatar.seed) {
      setSelectedAvatar(options[0]);
    }
  };

  const loadWorkspaceItems = async () => {
    try {
      // setIsLoading(true)

      // Load built-in agents
      const builtInResponse = await apiClient.getBuiltInAgents();
      if (builtInResponse.success && builtInResponse.data?.agents) {
        setBuiltInAgents(builtInResponse.data.agents);
      }

      // Load custom agents
      const response = await apiClient.getCustomAgents({
        limit: 100,
        sort_by: sortBy === "recent" ? "created_at" : "name",
        sort_order: "desc",
      });
      if (response.success && response.data) {
        setAgents(response.data.agents || []);
      }

      // Also load capabilities for agent creation (if not already loaded)
      if (capabilities.length === 0) {
        await loadCapabilities();
      }
    } catch (error) {
      console.error("Failed to load workspace items:", error);
      toast({
        title: "Error",
        description: "Failed to load workspace items",
        variant: "destructive",
        duration: 2000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableModels = async () => {
    if (!user) return;

    try {
      const response = await apiClient.models.list("default", {
        include_global: true,
        is_enabled: true,
      });

      if (response.success && response.data) {
        setAvailableModels(response.data.models || []);
      }
    } catch (error) {
      console.error("Failed to load available models:", error);
    }
  };

  const loadCapabilities = async () => {
    try {
      // SECURITY: Only load local (user-owned) capabilities
      // Global capabilities must be imported first before use
      const localResponse = await apiClient.getCapabilities({ limit: 100 });

      const localCaps =
        localResponse.success && localResponse.data
          ? localResponse.data.capabilities || []
          : [];

      setCapabilities(localCaps);
    } catch (error) {
      console.error("Failed to load capabilities:", error);
    }
  };

  const handleEditAgent = (agentId: string) => {
    navigate(`/custom-agents/${agentId}`);
  };

  const handleEditCapability = (capabilityId: string) => {
    navigate(`/capabilities/${capabilityId}`);
  };

  const openDetailDialog = (item: CustomAgent | Capability) => {
    setSelectedItem(item);
    setIsDetailDialogOpen(true);
  };

  const handleCreateAgent = async () => {
    // Validation based on agent type
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Agent name is required",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    if (formData.agent_type === "chat" && !formData.system_prompt.trim()) {
      toast({
        title: "Validation Error",
        description: "System prompt is required for conversational agents",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    if (formData.agent_type === "flow" && flowNodes.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one node is required for flow agents",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await apiClient.createCustomAgent({
        name: formData.name,
        emoji: formData.emoji || "🤖",
        description: formData.description,
        agent_type: formData.agent_type,
        system_prompt: formData.system_prompt || "",
        initial_message: formData.initial_message || undefined,
        interface_type: formData.interface_type,
        interface_config: formData.interface_config,
        tags: formData.tags,
        visibility: formData.visibility,
        configuration: formData.configuration,
        example_queries: formData.example_queries,
        capabilities:
          formData.agent_type === "chat"
            ? formData.capabilities.map((cap) => ({
              ...cap,
              custom_config: cap.custom_config ?? undefined,
            }))
            : [],
      });

      if (response.success && response.data) {
        // The API returns { success: true, agent: { id, name, ... } }
        // So we need to access response.data.agent, not response.data directly
        const createdAgent = response.data.agent || response.data;

        // Debug log the response structure


        // If there are flow nodes, create a flow for this agent
        if (formData.agent_type === "flow" && flowNodes.length > 0) {
          const startNode =
            flowNodes.find((n) => n.type?.startsWith("input")) || flowNodes[0];

          try {
            // Find the start node (usually the first input node)

            // Validate agent_id exists
            if (!createdAgent?.id) {
              console.error(
                "Agent response structure:",
                JSON.stringify(createdAgent, null, 2),
              );
              throw new Error(
                "Agent ID is missing from created agent response",
              );
            }

            const flowResponse = await apiClient.flows.create({
              name: `${formData.name} Workflow`,
              description: `Workflow for ${formData.name}`,
              agent_id: createdAgent.id,
              nodes: flowNodes.map((node) => ({
                id: node.id,
                type: node.type || "default",
                label: node.label,
                config: node.config || {},
                position: node.position,
              })),
              edges: flowEdges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label,
                // Only include condition if it's a valid object
                ...(edge.condition &&
                  typeof edge.condition === "object" &&
                  !Array.isArray(edge.condition)
                  ? { condition: edge.condition }
                  : {}),
              })),
              config: {
                startNodeId: startNode?.id || flowNodes[0]?.id,
                maxExecutionTime: 300,
                errorHandling: "stop",
                retryAttempts: 3,
                timeout: 300,
              },
              variables: {},
              tags: formData.tags,
              metadata: {
                created_with: "visual_builder",
                agent_name: formData.name,
              },
            });

            if (flowResponse.success) {
              toast({
                title: "Success",
                description: "Custom agent and workflow created successfully",
                duration: 2000
              });
            } else {
              toast({
                title: "Partial Success",
                description:
                  "Agent created but workflow creation failed. You can add a workflow later.",
                variant: "destructive",
                duration: 2000
              });
            }
          } catch (flowError: any) {
            console.error("Failed to create flow:", flowError);
            console.error(
              "Flow error details:",
              JSON.stringify(flowError, null, 2),
            );

            // Log the payload that was sent
            console.error(
              "Flow creation payload:",
              JSON.stringify(
                {
                  name: `${formData.name} Workflow`,
                  description: `Workflow for ${formData.name}`,
                  agent_id: createdAgent.id,
                  nodes: flowNodes,
                  edges: flowEdges,
                  config: {
                    startNodeId: startNode?.id || flowNodes[0]?.id,
                    maxExecutionTime: 300,
                    errorHandling: "stop",
                    retryAttempts: 3,
                    timeout: 300,
                  },
                },
                null,
                2,
              ),
            );

            toast({
              title: "Partial Success",
              description: `Agent created but workflow creation failed: ${flowError.message || "Unknown error"}. Check console for details.`,
              variant: "destructive",
              duration: 2000
            });
          }
        } else {
          toast({
            title: "Success",
            description: "Custom agent created successfully",
            duration: 2000
          });
        }

        setIsCreateDialogOpen(false);
        resetForm();
        loadWorkspaceItems();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create agent",
        variant: "destructive",
        duration: 2000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAgent = async () => {


    if (!selectedAgent) {
      console.error("❌ No selectedAgent found! Cannot update.");
      toast({
        title: "Error",
        description: "No agent selected for update",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    console.log(
      "✅ Selected agent found:",
      selectedAgent.id,
      selectedAgent.name,
    );

    // Validation based on agent type
    if (!formData.name.trim()) {
      console.error("❌ Validation failed: Name is required");
      toast({
        title: "Validation Error",
        description: "Agent name is required",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    if (formData.agent_type === "chat" && !formData.system_prompt.trim()) {
      console.error("❌ Validation failed: System prompt is required");
      toast({
        title: "Validation Error",
        description: "System prompt is required for conversational agents",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    try {
      console.log("🔄 Preparing update payload...");
      setIsSaving(true);

      // Preserve existing metadata and update flow if needed
      const existingMetadata = (selectedAgent as any).metadata || {};
      let updatedMetadata = { ...existingMetadata };

      // If flow agent and has flow nodes, update flow metadata
      if (formData.agent_type === "flow" && flowNodes.length > 0) {
        updatedMetadata = {
          ...updatedMetadata,
          flow: {
            ...updatedMetadata.flow,
            steps: flowNodes.map((node) => ({
              id: node.id,
              name: node.label,
              type: node.type?.split(".")[1] || "action",
              action: node.config?.action || "",
              timeout: node.config?.timeout,
              retry: node.config?.retry,
              conditions: node.config?.conditions,
              parallel: node.config?.parallel,
              depends_on: flowEdges
                .filter((edge) => edge.target === node.id)
                .map((edge) => edge.source),
            })),
          },
        };
      }

      console.log("📡 Sending update request to API...", {
        id: selectedAgent.id,
        name: formData.name,
        interface_type: formData.interface_type,
        interface_config_keys: Object.keys(formData.interface_config || {}),
      });

      const response = await apiClient.updateCustomAgent(selectedAgent.id, {
        name: formData.name,
        emoji: formData.emoji || "🤖",
        description: formData.description,
        agent_type: formData.agent_type,
        system_prompt: formData.system_prompt || "",
        initial_message: formData.initial_message || undefined,
        tags: formData.tags,
        visibility: formData.visibility,
        configuration: formData.configuration,
        example_queries: formData.example_queries,
        capabilities:
          formData.agent_type === "chat"
            ? formData.capabilities.map((cap) => ({
              ...cap,
              custom_config: cap.custom_config ?? undefined,
            }))
            : [],
        interface_type: formData.interface_type,
        interface_config: formData.interface_config,
        metadata: updatedMetadata,
      });

      console.log("📥 API Response:", response);

      if (response.success) {
        console.log("✅ Agent updated successfully");

        // Sync Flow object if this is a flow agent
        if (formData.agent_type === "flow") {
          try {
            console.log("🔄 Syncing Flow object for agent:", selectedAgent.id);

            // Prepare standard flow payload
            const startNode = flowNodes.find((n) => n.type?.startsWith("input")) || flowNodes[0];
            const mappedNodes = flowNodes.map((node) => ({
              id: node.id,
              type: node.type || "default",
              label: node.label,
              config: node.config || {},
              position: node.position,
            }));
            const mappedEdges = flowEdges.map((edge) => ({
              id: edge.id,
              source: edge.source,
              target: edge.target,
              label: edge.label,
              ...(edge.condition && typeof edge.condition === "object" && !Array.isArray(edge.condition)
                ? { condition: edge.condition }
                : {}),
            }));
            const flowConfig = {
              startNodeId: startNode?.id || flowNodes[0]?.id,
            };

            if (currentFlowId) {
              // Update existing flow
              await apiClient.flows.update(currentFlowId, {
                name: `${formData.name} Workflow`,
                agent_id: selectedAgent.id,
                nodes: mappedNodes,
                edges: mappedEdges,
                config: flowConfig,
                metadata: {
                  updated_at: new Date().toISOString(),
                  agent_name: formData.name
                }
              });
              console.log("✅ Flow updated successfully via API");
            } else {
              // Create new flow if missing (e.g. migration or corruption)
              console.log("⚠️ No existing flow found, creating new one...");
              const createResponse = await apiClient.flows.create({
                name: `${formData.name} Workflow`,
                description: `Workflow for ${formData.name}`,
                agent_id: selectedAgent.id,
                nodes: mappedNodes,
                edges: mappedEdges,
                config: {
                  ...flowConfig,
                  maxExecutionTime: 300,
                  errorHandling: "stop",
                  retryAttempts: 3,
                  timeout: 300,
                },
                tags: formData.tags,
                metadata: {
                  created_with: "visual_builder_sync",
                  agent_name: formData.name,
                }
              });
              if (createResponse.success && createResponse.data?.id) {
                setCurrentFlowId(createResponse.data.id);
                console.log("✅ New flow created successfully via API");
              }
            }
          } catch (flowError) {
            console.error("❌ Failed to sync flow data:", flowError);
            toast({
              title: "Warning",
              description: "Agent updated but flow synchronization failed. Wiring might be missing.",
              variant: "default",
              duration: 2000
            });
          }
        }

        toast({
          title: "Success",
          description: "Agent updated successfully",
          duration: 2000
        });
        setIsEditDialogOpen(false);
        setSelectedAgent(null);
        resetForm();
        loadWorkspaceItems();
      } else {
        console.error("❌ Update failed with API error:", response.error);
        toast({
          title: "Error",
          description: response.error || "Failed to update agent",
          variant: "destructive",
          duration: 2000
        });
      }
    } catch (error: any) {
      console.error("❌ Exception in handleUpdateAgent:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update agent",
        variant: "destructive",
        duration: 2000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (
    id: string,
    name: string,
    type: "agent" | "capability",
  ) => {
    setItemToDelete({ id, name, type });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);

      if (itemToDelete.type === "agent") {
        const response = await apiClient.deleteCustomAgent(
          itemToDelete.id,
          false,
        );
        if (response.success) {
          toast({
            title: "Success",
            description: "Agent deleted successfully",
            duration: 2000
          });
        }
      } else {
        const response = await apiClient.deleteCapability(
          itemToDelete.id,
          false,
        );
        if (response.success) {
          toast({
            title: "Success",
            description: "Capability deleted successfully",
            duration: 2000
          });
        }
      }

      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      loadWorkspaceItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${itemToDelete.type}`,
        variant: "destructive",
        duration: 2000
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloneAgent = async (agentId: string) => {
    try {
      const response = await apiClient.cloneCustomAgent(agentId, {
        new_name: `Clone of ${agents.find((a) => a.id === agentId)?.name}`,
        new_description: "Cloned agent",
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Agent cloned successfully",
          duration: 2000
        });
        loadWorkspaceItems();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clone agent",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  // Wizard State
  const [currentStep, setCurrentStep] = useState("basic");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Validation
  const validateStep = (stepId: string) => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (stepId === "basic") {
      if (!formData.name?.trim()) {
        errors.name = "Please filled the things";
        isValid = false;
      }
      if (!formData.description?.trim()) {
        errors.description = "Please filled the things";
        isValid = false;
      }
      if (!formData.initial_message?.trim()) {
        errors.initial_message = "Please filled the things";
        isValid = false;
      }
    } else if (stepId === "prompt") {
      if (!formData.system_prompt?.trim()) {
        errors.system_prompt = "Please filled the things";
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  // Calculate available steps based on agent type
  const getSteps = () => {
    const steps = [{ id: "basic", label: "Basic Info", icon: Sparkles }];

    if (formData.agent_type === "chat") {
      steps.push(
        { id: "prompt", label: "System Prompt", icon: MessageSquare },
        { id: "examples", label: "Examples", icon: List },
        { id: "capabilities", label: "Capabilities", icon: Zap },
      );
    } else {
      steps.push({ id: "flow", label: "Flow Builder", icon: GitBranch });
    }

    steps.push({ id: "interface", label: "Interface", icon: Layout });

    return steps;
  };

  const steps = getSteps();
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStep(steps[currentStepIndex + 1].id);
      }
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  // Handle dialog open behavior
  const openCreateDialog = () => {
    resetForm();
    setFlowNodes([]); // Clear flow nodes specifically
    setIsFlowOnlyMode(false); // Regular agent creation (both types available)
    setIsCreateDialogOpen(true);
    setCurrentStep("basic");
  };

  // Open dialog for creating flow agents


  const openEditDialog = async (agent: CustomAgent) => {
    try {
      setEditingAgentId(agent.id);
      setSelectedAgent(agent);
      setFormData({
        name: agent.name,
        emoji: (agent as any).emoji || "🤖",
        description: agent.description,
        agent_type: (agent as any).agent_type || "chat",
        model_id: (agent as any).model_id,
        fallback_model_ids: (agent as any).fallback_model_ids || [],
        system_prompt: agent.system_prompt,
        initial_message: (agent as any).initial_message || "",
        interface_type: agent.interface_type || "chat",
        interface_config: agent.interface_config || {},
        tags: agent.tags,
        visibility:
          agent.visibility === "organization"
            ? "shared"
            : (agent.visibility as "private" | "public" | "shared"),
        configuration: {
          temperature: agent.configuration.temperature,
          max_tokens: agent.configuration.max_tokens,
          top_p: agent.configuration.top_p,
          frequency_penalty: agent.configuration.frequency_penalty,
          presence_penalty: agent.configuration.presence_penalty,
          stop_sequences: [],
        },
        example_queries: agent.example_queries,
        capabilities: agent.capabilities,
      });

      // Load flow data from flows API if agent is flow type
      if ((agent as any).agent_type === "flow") {
        try {
          // Fetch flows for this agent (get all flows and filter client-side)
          const flowsResponse = await apiClient.flows.list({
            limit: 100,
            offset: 0,
          });

          if (flowsResponse.success && flowsResponse.data?.flows) {
            // Find the flow that belongs to this agent
            const agentFlow = flowsResponse.data.flows.find(
              (flow: any) => flow.agent_id === agent.id,
            );

            if (agentFlow) {
              console.log("Loaded flow for agent:", agentFlow);
              // Ensure nodes and edges have the expected structure
              setFlowNodes(agentFlow.nodes || []);
              setFlowEdges(agentFlow.edges || []);
              setCurrentFlowId(agentFlow.id);
            } else {
              console.log("No flow found for agent:", agent.id);
              setFlowNodes([]);
              setFlowEdges([]);
              setCurrentFlowId(null);
            }
          } else {
            setFlowNodes([]);
            setFlowEdges([]);
            setCurrentFlowId(null);
          }
        } catch (error) {
          console.error("Failed to load flow data:", error);
          setFlowNodes([]);
          setFlowEdges([]);
          setCurrentFlowId(null);
        }
      } else {
        // Clear flow state for non-flow agents
        setFlowNodes([]);
        setFlowEdges([]);
        setCurrentFlowId(null);
      }

      // Set flow-only mode if this is a flow agent


      if ((agent as any).agent_type === "flow") {

        // setIsFlowOnlyMode(true); // Don't hijack the dialog
        // setCurrentStep("flow"); // Let user navigate or we can set it
      } else {

        setIsFlowOnlyMode(false);
        setCurrentStep("basic");
      }

      navigate(`/agents/${agent.id}/edit`);
    } catch (error) {
      console.error("Error opening edit dialog:", error);
      toast({
        title: "Error",
        description: "Failed to load agent details",
        variant: "destructive",
        duration: 2000
      });
    } finally {
      setEditingAgentId(null);
    }
  };

  // Handler to update node configuration
  const handleNodeConfigUpdate = (
    nodeId: string,
    newConfig: Record<string, any>,
    newLabel?: string,
  ) => {
    setFlowNodes((prev) =>
      prev.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            label: newLabel || node.label,
            config: newConfig,
          };
        }
        return node;
      }),
    );
  };

  const resetForm = () => {
    setFormData({
      name: "",
      emoji: "",
      description: "",
      agent_type: "chat",
      model_id: undefined,
      fallback_model_ids: [],
      initial_message: "",
      interface_type: "chat" as "chat" | "form" | "json" | "api" | "wizard",
      interface_config: {} as Record<string, any>,
      system_prompt: "",
      tags: [],
      visibility: "private",
      configuration: {
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop_sequences: [],
      },
      example_queries: [],
      capabilities: [],
    });
    setNewTag("");
    setNewExampleQuery({ query: "", expected_response: "", description: "" });
    setSelectedAvatar({
      variant: "beam",
      seed: "",
      colors: ["#a855f7", "#ec4899", "#ffffff"],
    });
    setAvatarOptions([]);
    generateAvatarOptions();
    setFlowNodes([]);
    setFlowEdges([]);
    setSelectedFlowNode(null);
  };

  const handleOpenImportDialog = () => {
    setImportJSON("");
    setImportMethod("paste");
    setIsImportDialogOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast({
        title: "Invalid File",
        description: "Please upload a .json file",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportJSON(content);
    };
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
        duration: 2000
      });
    };
    reader.readAsText(file);
  };

  const processImportJSON = () => {
    try {
      const json = importJSON.trim();
      if (!json) {
        toast({
          title: "Error",
          description: "Please paste or upload JSON content",
          variant: "destructive",
          duration: 2000
        });
        return;
      }

      const data = JSON.parse(json);

      // Validate required fields
      if (!data.name) {
        toast({
          title: "Invalid JSON",
          description: 'JSON must include "name" field',
          variant: "destructive",
          duration: 2000
        });
        return;
      }

      // Ensure configuration has proper structure
      const validatedConfig = {
        temperature: data.configuration?.temperature ?? 0.7,
        max_tokens: data.configuration?.max_tokens ?? 2048,
        top_p: data.configuration?.top_p ?? 1,
        frequency_penalty: data.configuration?.frequency_penalty ?? 0,
        presence_penalty: data.configuration?.presence_penalty ?? 0,
        stop_sequences: data.configuration?.stop_sequences || [],
      };

      // Ensure capabilities have proper structure
      const validatedCapabilities = (data.capabilities || []).map(
        (cap: any) => ({
          capability_id: cap.capability_id || cap,
          enabled: cap.enabled ?? true,
        }),
      );

      // Ensure example queries have proper structure
      const validatedExamples = (data.example_queries || []).map((ex: any) => ({
        query: ex.query || "",
        expected_response: ex.expected_response || "",
        description: ex.description || "",
      }));

      // Auto-detect agent type if not specified
      // If flow_nodes are present, it's a flow agent; otherwise it's a chat agent
      const detectedAgentType =
        data.agent_type ||
        (data.flow_nodes && data.flow_nodes.length > 0 ? "flow" : "chat");

      setFormData({
        name: data.name,
        emoji: data.emoji || "",
        description: data.description || "",
        agent_type: detectedAgentType as "chat" | "flow",
        model_id: data.model_id,
        fallback_model_ids: data.fallback_model_ids || [],
        system_prompt: data.system_prompt || "",
        tags: data.tags || [],
        visibility: data.visibility || "private",
        configuration: validatedConfig,
        example_queries: validatedExamples,
        capabilities: validatedCapabilities,
        initial_message: data.initial_message || "",
        interface_type: (data.interface_type || "chat") as
          | "chat"
          | "form"
          | "json"
          | "api"
          | "wizard",
        interface_config: data.interface_config || ({} as Record<string, any>),
      });

      // Handle flow nodes if present
      if (data.flow_nodes) {
        setFlowNodes(data.flow_nodes);
      }
      if (data.flow_edges) {
        setFlowEdges(data.flow_edges);
      }

      // Handle avatar if present
      if (data.avatar) {
        setSelectedAvatar(data.avatar);
      }

      toast({
        title: "Success!",
        description: `Imported agent: ${data.name}. Review and click Create to save.`,
        duration: 2000
      });

      setIsImportDialogOpen(false);
      setIsCreateDialogOpen(true);
      setCurrentStep("basic");
    } catch (e: any) {
      toast({
        title: "Invalid JSON",
        description:
          e.message || "Failed to parse JSON. Please check the format.",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const handleExportAgentToJSON = () => {
    const exportData: any = {
      name: formData.name,
      emoji: formData.emoji,
      description: formData.description,
      agent_type: formData.agent_type,
      model_id: formData.model_id,
      fallback_model_ids: formData.fallback_model_ids,
      system_prompt: formData.system_prompt,
      tags: formData.tags,
      visibility: formData.visibility,
      configuration: formData.configuration,
      example_queries: formData.example_queries,
      capabilities: formData.capabilities,
      avatar: selectedAvatar,
    };

    // Include flow data if it's a flow agent
    if (formData.agent_type === "flow") {
      exportData.flow_nodes = flowNodes;
      exportData.flow_edges = flowEdges;
    }

    const json = JSON.stringify(exportData, null, 2);

    navigator.clipboard
      .writeText(json)
      .then(() => {
        toast({
          title: "Copied to Clipboard!",
          description: "Agent JSON has been copied. You can paste it anywhere.",
          duration: 2000
        });
      })
      .catch(() => {
        // Fallback: show in a text area
        const textarea = document.createElement("textarea");
        textarea.value = json;
        textarea.style.position = "fixed";
        textarea.style.top = "50%";
        textarea.style.left = "50%";
        textarea.style.transform = "translate(-50%, -50%)";
        textarea.style.width = "80%";
        textarea.style.height = "60%";
        textarea.style.zIndex = "10000";
        textarea.style.padding = "20px";
        textarea.style.fontSize = "14px";
        textarea.style.fontFamily = "monospace";
        textarea.style.border = "3px solid #10b981";
        textarea.style.borderRadius = "12px";
        textarea.style.boxShadow = "0 20px 50px rgba(0,0,0,0.3)";
        textarea.readOnly = true;

        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
        overlay.style.zIndex = "9999";
        overlay.style.backdropFilter = "blur(4px)";

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Close";
        closeBtn.style.position = "fixed";
        closeBtn.style.top = "50%";
        closeBtn.style.left = "50%";
        closeBtn.style.transform = "translate(-50%, calc(-50% + 250px))";
        closeBtn.style.zIndex = "10001";
        closeBtn.style.padding = "10px 24px";
        closeBtn.style.backgroundColor = "#10b981";
        closeBtn.style.color = "white";
        closeBtn.style.border = "none";
        closeBtn.style.borderRadius = "8px";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontWeight = "600";

        const cleanup = () => {
          document.body.removeChild(overlay);
          document.body.removeChild(textarea);
          document.body.removeChild(closeBtn);
        };

        closeBtn.onclick = cleanup;
        overlay.onclick = cleanup;

        document.body.appendChild(overlay);
        document.body.appendChild(textarea);
        document.body.appendChild(closeBtn);

        textarea.select();

        toast({
          title: "Export Ready",
          description: "Select all and copy the JSON manually",
          duration: 2000
        });
      });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const addExampleQuery = () => {
    if (newExampleQuery.query.trim()) {
      setFormData({
        ...formData,
        example_queries: [...formData.example_queries, { ...newExampleQuery }],
      });
      setNewExampleQuery({ query: "", expected_response: "", description: "" });
    }
  };

  const removeExampleQuery = (index: number) => {
    setFormData({
      ...formData,
      example_queries: formData.example_queries.filter((_, i) => i !== index),
    });
  };

  // Simple toggle capability - no complex configuration needed
  // The LLM handles all intent detection, parameter gathering, and response formatting
  const toggleCapability = (capabilityId: string) => {
    const isCurrentlyEnabled = formData.capabilities.some(
      (c) => c.capability_id === capabilityId,
    );

    if (isCurrentlyEnabled) {
      // Remove capability
      setFormData({
        ...formData,
        capabilities: formData.capabilities.filter(
          (c) => c.capability_id !== capabilityId,
        ),
      });
    } else {
      // Add capability
      setFormData({
        ...formData,
        capabilities: [
          ...formData.capabilities,
          {
            capability_id: capabilityId,
            enabled: true,
            custom_config: null,
          },
        ],
      });
    }
  };

  // Load sample data for conversation agent
  const loadConversationAgentSample = () => {
    setFormData({
      name: "Sample Conversation Agent",
      emoji: "🧪",
      description:
        "A helpful conversation agent that demonstrates conversational capabilities with sample configuration",
      agent_type: "chat",
      model_id: undefined,
      fallback_model_ids: [],
      system_prompt: `You are a helpful assistant designed to demonstrate conversational AI capabilities.

You should:
- Provide clear, concise responses
- Be friendly and professional
- Help users understand how custom agents work
- Demonstrate the agent's capabilities through example interactions

When users ask about your features, explain that you're a sample agent created for testing purposes.`,
      tags: ["sample", "conversation", "demo"],
      visibility: "private",
      configuration: {
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop_sequences: [],
      },
      initial_message: "",
      interface_type: "chat" as "chat" | "form" | "json" | "api" | "wizard",
      interface_config: {} as Record<string, any>,
      example_queries: [
        {
          query: "What can you help me with?",
          expected_response:
            "I'm a conversation agent designed to demonstrate how custom agents work. I can help you understand conversational AI capabilities, answer questions, and show how agents can be configured with custom behaviors.",
          description: "General capabilities question",
        },
        {
          query: "Tell me about yourself",
          expected_response:
            "I'm a sample agent created to showcase the custom agent feature. I'm powered by an LLM and configured with a specific system prompt that defines my behavior and personality.",
          description: "Agent identity question",
        },
      ],
      capabilities: [],
    });

    // Generate sample avatar
    if (avatarOptions.length === 0) {
      generateAvatarOptions();
    }

    toast({
      title: "Sample Data Loaded",
      description:
        "Conversation agent template loaded. Review and modify as needed.",
      duration: 2000
    });
    setCurrentStep("basic");
  };

  // Load sample data for flow agent
  const loadFlowAgentSample = () => {
    setFormData({
      name: "Sample Flow Agent",
      emoji: "⚡",
      description:
        "A sample flow-based agent that demonstrates sequential workflow execution with multiple steps",
      agent_type: "flow",
      model_id: undefined,
      fallback_model_ids: [],
      system_prompt:
        "This is a flow-based agent that executes tasks in a defined sequence.",
      tags: ["sample", "flow", "workflow", "demo"],
      visibility: "private",
      configuration: {
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop_sequences: [],
      },
      initial_message: "",
      interface_type: "chat" as "chat" | "form" | "json" | "api" | "wizard",
      interface_config: {} as Record<string, any>,
      example_queries: [],
      capabilities: [],
    });

    // Set sample flow nodes
    const sampleFlowNodes: FlowNodeType[] = [
      {
        id: "start_node",
        type: "input.form",
        label: "User Input",
        config: {
          fields: [
            {
              name: "query",
              type: "text",
              required: true,
              label: "Enter your question",
            },
          ],
        },
        position: { x: 100, y: 100 },
      },
      {
        id: "process_node",
        type: "action.llm",
        label: "Process with AI",
        config: {
          model: "default",
          prompt: "Process the user query: {{input.query}}",
          temperature: 0.7,
        },
        position: { x: 100, y: 250 },
      },
      {
        id: "output_node",
        type: "output.message",
        label: "Send Response",
        config: {
          message: "{{process_node.result}}",
        },
        position: { x: 100, y: 400 },
      },
    ];

    const sampleFlowEdges: FlowEdge[] = [
      {
        id: "edge_1",
        source: "start_node",
        target: "process_node",
        label: "Submit",
      },
      {
        id: "edge_2",
        source: "process_node",
        target: "output_node",
        label: "Complete",
      },
    ];

    setFlowNodes(sampleFlowNodes);
    setFlowEdges(sampleFlowEdges);

    // Generate sample avatar
    if (avatarOptions.length === 0) {
      generateAvatarOptions();
    }

    toast({
      title: "Sample Data Loaded",
      description:
        "Flow agent template loaded with 3-node workflow. Review and modify as needed.",
      duration: 2000
    });
    setCurrentStep("basic");
  };

  // Filter items
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" ||
      (filterCategory === "custom" && agent.id) ||
      (agent as any).tags?.includes(filterCategory);
    return matchesSearch && matchesCategory;
  });

  const paginatedAgents = filteredAgents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);

  const filteredCapabilities = capabilities.filter((capability) => {
    const matchesSearch =
      capability.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capability.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || capability.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const allCategories = Array.from(
    new Set(agents.flatMap((a) => (a as any).tags || [])),
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#EEF2F7] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 dark:text-white">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#EEF2F7] dark:bg-[#0f1219] min-h-full flex flex-col">
      {/* Header Section */}
      <div className="bg-[#EEF2F7] dark:bg-[#0d1117]  dark:border-slate-800 px-8 pt-5 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          {/* <Breadcrumbs /> */}
          {/* Title Row */}
          <div className="flex justify-between items-center -mb-2 px-8">
            <div>
              <h1 className="text-lg font-medium font-sans text-slate-800 dark:text-gray-100 tracking-tight">
                Welcome back,{" "}
                <span className="text-[#105e6e] dark:text-teal-400 font-semibold">
                  {user?.display_name || user?.email?.split('@')[0] || "User"}
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-1">
              {/* <Button
                variant="outline"
                size="sm"
                className="h-8 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
                onClick={handleExportAgentToJSON}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export
              </Button> */}
              <Button
                onClick={() => navigate('/agents/create')}
                size="sm"
                className="h-7 bg-[#105e6e] hover:bg-[#0d4d59] text-white text-[11px] font-medium shadow-sm px-3 rounded text-center transition-colors"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create Agent
              </Button>
            </div>
          </div>
          {/* Stats Cards */}
          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "TOTAL AGENTS", value: agents.length + 4, sub: "agents", dot: null, trend: null, icon: Bot, iconColor: "text-indigo-500 dark:text-indigo-400", iconBg: "bg-indigo-50 dark:bg-indigo-500/10" },
              { label: "ACTIVE", value: 4, sub: null, dot: "bg-emerald-500", trend: null, icon: Activity, iconColor: "text-emerald-500 dark:text-emerald-400", iconBg: "bg-emerald-50 dark:bg-emerald-500/10" },
              { label: "PENDING SETUP", value: 2, sub: null, dot: "bg-amber-400", trend: null, icon: Settings, iconColor: "text-amber-500 dark:text-amber-400", iconBg: "bg-amber-50 dark:bg-amber-500/10" },
              { label: "CONVERSATIONS", value: 847, sub: null, dot: null, trend: "-12%", icon: MessageSquare, iconColor: "text-blue-500 dark:text-blue-400", iconBg: "bg-blue-50 dark:bg-blue-500/10" },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 hover:bg-white dark:hover:bg-slate-800/70 hover:shadow-sm transition-all duration-200">
                <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {stat.dot && <span className={`w-2 h-2 rounded-full ${stat.dot} inline-block`} />}
                      <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stat.value}</span>
                    </div>
                    {stat.sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{stat.sub}</p>}
                    {stat.trend && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-0.5">
                        <TrendingDown className="h-2.5 w-2.5" />{stat.trend}
                      </p>
                    )}
                  </div>
                  <div className={`p-1.5 rounded-lg ${stat.iconBg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div> */}
        </div>
      </div>


      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-8 py-6 space-y-6">

        {/* Filter Tabs + Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <Input
              placeholder="Search agents and models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50 shadow-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-900/60 rounded-lg p-1 shadow-sm">
              {["All", "Built-in", "Custom"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterCategory(tab.toLowerCase())}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
                    filterCategory === tab.toLowerCase()
                      ? "bg-teal-50 dark:bg-teal-500/10 text-[#105e6e] dark:text-teal-400"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Grid/List toggle */}
            <div className="flex items-center bg-white dark:bg-[#1e2433] border border-slate-200 dark:border-[#2d3545] rounded-lg overflow-hidden shadow-sm h-[34px]">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 h-full transition-colors flex items-center justify-center ${viewMode === 'grid'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 h-full transition-colors flex items-center justify-center border-l border-slate-200 dark:border-[#2d3545] ${viewMode === 'list'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Built-in Agents Section */}
        {(filterCategory === "all" || filterCategory === "built-in") && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Built-in Agents</p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{builtInAgents.length} available</span>
            </div>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {builtInAgents.map((agent) => {
                  const Icon = getAgentIcon(agent.id);
                  return (
                    <div
                      key={agent.id}

                      className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-indigo-500/30 rounded-sm p-4 shadow-md dark:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15)] hover:shadow-lg dark:hover:shadow-[0_8px_30px_-4px_rgba(99,102,241,0.25)] hover:border-indigo-300 dark:hover:border-indigo-500/60 transition-all duration-200 cursor-pointer group flex flex-col h-full"
                      onClick={() => navigate(`/agents/${agent.id}`)}
                    >


                      <div className="flex items-start gap-3 mb-3">
                        {/* <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-300 flex-shrink-0">
                          <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        </div> */}
                        <div className="min-w-0 flex flex-col justify-center h-10">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate leading-tight dark:[text-shadow:0_1px_15px_rgba(255,255,255,0.4)]">{agent.name}</p>
                          <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">{getAgentRole(agent.id)}</p>
                        </div>
                      </div>

                      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 mb-4 flex-1">{agent.description}</p>

                      <div className="mt-auto">
                        {agent.supports_websocket ? (
                          <div className="flex items-center">
                            <div className="flex items-center gap-1.5">

                              <span className="text-[10px] text-slate-500 dark:text-slate-400">Ready</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="flex items-center gap-1.5">

                              <span className="text-[10px] text-slate-500 dark:text-slate-400">Setup required</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-[#e2e8f0] dark:border-[#1e2a3d] bg-white dark:bg-[#0d1424] overflow-hidden shadow-sm">
                <div className="grid grid-cols-[2fr_2fr_1.5fr_100px_80px] gap-3 px-5 py-3 border-b border-slate-100 dark:border-[#1e2a3d] bg-slate-50 dark:bg-[#111827]">
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-[#4a5568] uppercase">Name</p>
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-[#4a5568] uppercase">Role</p>
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-[#4a5568] uppercase">Status</p>
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-[#4a5568] uppercase">Uptime</p>
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-[#4a5568] uppercase">Actions</p>
                </div>
                {builtInAgents.map((agent, idx, arr) => {
                  const Icon = getAgentIcon(agent.id);
                  const role = getAgentRole(agent.id);
                  const route = `/agents/${agent.id}`;
                  const status = agent.supports_websocket ? "operational" : "setup";
                  const uptime = agent.supports_websocket ? "99.9% uptime" : null;
                  return (
                    <div
                      key={agent.id}
                      className={cn(
                        "grid grid-cols-[2fr_2fr_1.5fr_100px_80px] gap-3 px-5 py-3.5 items-center cursor-pointer transition-colors",
                        idx % 2 === 1
                          ? "bg-slate-50/80 dark:bg-[#111827] hover:bg-slate-100/70 dark:hover:bg-[#162035]"
                          : "bg-white dark:bg-[#0d1424] hover:bg-slate-50 dark:hover:bg-[#111d30]",
                        idx < arr.length - 1 && "border-b border-slate-100 dark:border-[#1e2a3d]"
                      )}
                      onClick={() => navigate(route)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1a2540] border border-transparent dark:border-[#263354] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        </div> */}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-300 truncate">{agent.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-[#4a6080] truncate">Built-in</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-[#5a7090] truncate">{role}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gray-400" />

                        <span className="text-xs font-light text-gray-500 dark:text-gray-400">
                          {status === "operational" ? "Operational" : "Setup required"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-[#4a6080]">{uptime || "-"}</p>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {status === "operational" ? (
                          <button className="text-[10px] bg-slate-100 dark:bg-[#1e2a40] hover:bg-slate-200 dark:hover:bg-[#263550] text-slate-600 dark:text-slate-300 border dark:border-[#2a3a55] px-3 flex items-center justify-center h-6 rounded font-medium transition-colors w-full" onClick={() => navigate(route)}>Open</button>
                        ) : (
                          <button className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 font-medium transition-colors w-full text-left">Configure</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Custom Agents Section */}
        {(filterCategory === "all" || filterCategory === "custom") && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Custom Agents</p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {filteredAgents.length > 0 ? `${filteredAgents.length} agent${filteredAgents.length !== 1 ? 's' : ''}` : "0 agents"}
              </span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 rounded-sm border border-slate-200 dark:border-slate-700/50">
                <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-700 border-t-[#105e6e] rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-400 dark:text-slate-500">Loading agents...</p>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <Bot className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">No custom agents yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Create your first agent to get started</p>
                <Button onClick={() => navigate("/agents/create")} size="sm" className="h-8 bg-[#105e6e] hover:bg-[#0d4d59] text-white text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Agent
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  {paginatedAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-indigo-500/30 rounded-sm p-4 shadow-md dark:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15)] hover:shadow-lg dark:hover:shadow-[0_8px_30px_-4px_rgba(99,102,241,0.25)] hover:border-indigo-300 dark:hover:border-indigo-500/60 transition-all duration-200 cursor-pointer group flex flex-col h-full"
                      // className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-md p-4 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-200 cursor-pointer group flex flex-col h-full"
                      onClick={() => navigate(`/agents/custom/${encodeURIComponent(agent.name)}`)}
                    >
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-300 truncate dark:[text-shadow:0_1px_15px_rgba(255,255,255,0.4)]">{agent.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">Custom</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={() => navigate(`/agents/${agent.id}/details`)}
                            title="View Details"
                          >
                            <Activity className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            disabled={editingAgentId === agent.id}
                            onClick={() => openEditDialog(agent)}
                            title="Edit"
                          >
                            {editingAgentId === agent.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Edit className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            onClick={() => openDeleteDialog(agent.id, agent.name, "agent")}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 flex-1">
                        {agent.description}
                      </p>


                      <div className="flex flex-wrap gap-1 mb-3">
                        {((agent as any).tags || []).slice(0, 3).map((tag: string) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Ready</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatRelativeTime((agent as any).last_updated || agent.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                {filteredAgents.length > itemsPerPage && (
                  <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredAgents.length)} of {filteredAgents.length} agents
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>

                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          className={cn(
                            "px-2.5 py-1 rounded border text-[10px] transition-colors",
                            currentPage === i + 1
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold"
                              : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button
                        className={cn("p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors", currentPage === totalPages && "opacity-40 cursor-not-allowed")}
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-md border border-[#e2e8f0] dark:border-[#1e2a3d] bg-white dark:bg-[#0d1424] overflow-hidden shadow-sm">
                {/* Table header */}
                <div className="grid grid-cols-[2fr_2.5fr_1.5fr_1fr_80px] gap-4 px-5 py-3 border-b border-slate-100 dark:border-[#1e2a3d] bg-slate-50 dark:bg-[#111827]">
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-[#4a5568] uppercase">Agent Name</p>
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-[#4a5568] uppercase">Description</p>
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-[#4a5568] uppercase">Tags</p>
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-[#4a5568] uppercase">Status</p>
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-[#4a5568] uppercase text-right">Actions</p>
                </div>
                {paginatedAgents.map((agent, idx) => (
                  <div
                    key={agent.id}
                    className={cn(
                      "grid grid-cols-[2fr_2.5fr_1.5fr_1fr_80px] gap-4 px-5 py-3.5 items-center cursor-pointer transition-colors",
                      idx % 2 === 1
                        ? "bg-slate-50/80 dark:bg-[#111827] hover:bg-slate-100/70 dark:hover:bg-[#162035]"
                        : "bg-white dark:bg-[#0d1424] hover:bg-slate-50 dark:hover:bg-[#111d30]",
                      idx < paginatedAgents.length - 1 && "border-b border-slate-100 dark:border-[#1e2a3d]"
                    )}
                    onClick={() => navigate(`/agents/custom/${encodeURIComponent(agent.name)}`)}
                  >
                    {/* Name column */}
                    <div className="flex items-center gap-3 min-w-0">

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{agent.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-[#4a6080] truncate">Custom · {formatRelativeTime(agent.created_at)}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-[#5a7090] line-clamp-1 pr-2">{agent.description || '—'}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {((agent as any).tags || []).slice(0, 2).map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-slate-100 dark:bg-[#1a2540] text-slate-500 dark:text-[#7890b0] border border-slate-200 dark:border-[#263354]">{tag}</span>
                      ))}
                      {((agent as any).tags?.length || 0) > 2 && (
                        <span className="text-[9px] text-slate-400">+{(agent as any).tags.length - 2}</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1.5">

                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />

                      <span className="text-xs text-gray-500 dark:text-gray-400 font-light">Ready</span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={() => navigate(`/agents/${agent.id}/details`)}
                        title="View Details"
                      >
                        <Activity className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        onClick={() => openEditDialog(agent)}
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        onClick={() => openDeleteDialog(agent.id, agent.name, "agent")}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Pagination */}
                {filteredAgents.length > itemsPerPage && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-[#1e2a3d]">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredAgents.length)} of {filteredAgents.length} agents
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>

                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          className={cn(
                            "px-2.5 py-1 rounded border text-[10px] transition-colors",
                            currentPage === i + 1
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold"
                              : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button
                        className={cn("p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors", currentPage === totalPages && "opacity-40 cursor-not-allowed")}
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>







      {/* Detail Dialog - Similar to Library */}
      < Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen} >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <div className="w-4 h-4 bg-indigo-500 rounded-full" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2">
                      {selectedItem.name}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      {selectedItem.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Metadata */}
                <div>
                  <h3 className="font-semibold mb-2">Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        Created
                      </p>
                      <p className="text-sm font-semibold">
                        {formatRelativeTime(selectedItem.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        Status
                      </p>
                      <Badge variant="default" className="text-xs">
                        {selectedItem.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Close
                </Button>
                {"system_prompt" in selectedItem ? (

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-indigo-600 hover:text-white hover:bg-indigo-600 transition-colors duration-200"
                    disabled={editingAgentId === selectedItem.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(selectedItem as CustomAgent);
                    }}
                  >
                    {editingAgentId === selectedItem.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4 mr-1" />
                    )}
                    Edit
                  </Button>

                ) : (
                  <Button
                    onClick={() => handleEditCapability(selectedItem.id)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Capability
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog >

      {/* Create/Edit Agent Dialog */}
      < Dialog
        open={isCreateDialogOpen || isEditDialogOpen
        }
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setIsFlowOnlyMode(false); // Reset flow-only mode
            setSelectedAgent(null);
            resetForm();
            setCurrentStep("basic");
          }
        }}
      >
        <DialogContent className={cn(
          "w-screen h-screen max-w-none max-h-none m-0",
          isFlowOnlyMode ? "p-0 overflow-hidden" : "p-6 overflow-y-auto"
        )}>
          {/* Dialog Header - Hidden in flow-only mode */}
          {!isFlowOnlyMode && (
            <DialogHeader>
              <DialogTitle>
                {isEditDialogOpen ? "Edit Agent" : "Create New Agent"}
              </DialogTitle>
              <DialogDescription>
                {isEditDialogOpen
                  ? "Update your custom agent configuration"
                  : "Configure your custom AI agent with specific behaviors and capabilities"}
              </DialogDescription>
            </DialogHeader>
          )}


          {/* Agent Type Selector - Hidden in flow-only mode */}

          {!isFlowOnlyMode && (
            <div className="mb-6 p-4 border border-gray-200 dark:border-[#3d4555] rounded-lg bg-gray-50 dark:bg-[#2d3545]">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold dark:text-white">
                  Agent Type
                </Label>
                {user?.is_system_admin && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={loadConversationAgentSample}
                      className="text-xs bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                    >
                      <TestTube className="h-3 w-3 mr-1" />
                      Load Chat Sample
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={loadFlowAgentSample}
                      className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      <TestTube className="h-3 w-3 mr-1" />
                      Load Flow Sample
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md dark:bg-[#1e2433] dark:border dark:border-[#2d3545]",
                    formData.agent_type === "chat" &&
                    "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20",
                  )}
                  onClick={() => setFormData({ ...formData, agent_type: "chat" })}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                        formData.agent_type === "chat"
                          ? "bg-purple-500 border-purple-500"
                          : "border-gray-300 dark:border-gray-600",
                      )}
                    >
                      {formData.agent_type === "chat" && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="font-semibold dark:text-white">
                          Conversational Agent
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Free-flowing conversations with LLM. Define behavior
                        through system prompts and give the agent capabilities to
                        call.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md dark:bg-[#1e2433] dark:border dark:border-[#2d3545]",
                    formData.agent_type === "flow" &&
                    "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20",
                  )}
                  onClick={() => setFormData({ ...formData, agent_type: "flow" })}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                        formData.agent_type === "flow"
                          ? "bg-blue-500 border-blue-500"
                          : "border-gray-300 dark:border-gray-600",
                      )}
                    >
                      {formData.agent_type === "flow" && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold dark:text-white">
                          Flow Agent
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Strict sequential workflow. Build visual flows with input,
                        decision, action, and output nodes.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Stepper Header - Only show in normal mode */}
          {!isFlowOnlyMode && (
            <>
              <div className="mb-6 max-w-3xl mx-auto w-full">
                {/* Visual Steps - Horizontal Scrollable if needed */}
                <div className="flex items-center  justify-center gap-2 mt-4 pb-2 scrollbar-none">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStepIndex;
                    const isCompleted = index < currentStepIndex;

                    return (
                      <div
                        key={step.id}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-default",
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700"
                            : isCompleted
                              ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20"
                              : "text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50",
                        )}
                      >
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                            isActive
                              ? "bg-indigo-600 text-white"
                              : isCompleted
                                ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
                          )}
                        >
                          {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                        </div>
                        <span>{step.label}</span>
                        {index < steps.length - 1 && (
                          <div className="h-px w-4 bg-gray-200 mx-2 hidden sm:block" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 pr-1">
                {/* Basic Info Step */}
                {currentStep === "basic" && (
                  <div className="space-y-4 mt-4">
                    {/* Name */}
                    <div>
                      <Label htmlFor="name">Agent Name *</Label>
                      <Input
                        id="name"
                        placeholder="My Custom Agent"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (formErrors.name) {
                            setFormErrors({ ...formErrors, name: "" });
                          }
                        }}
                        className={cn(
                          formErrors.name &&
                          "border-red-500 focus-visible:ring-red-500",
                        )}
                      />
                      {formErrors.name && (
                        <p className="text-xs text-red-500 mt-1">
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what your agent does..."
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({ ...formData, description: e.target.value });
                          if (formErrors.description) {
                            setFormErrors({ ...formErrors, description: "" });
                          }
                        }}
                        rows={3}
                        className={cn(
                          formErrors.description &&
                          "border-red-500 focus-visible:ring-red-500",
                        )}
                      />
                      {formErrors.description && (
                        <p className="text-xs text-red-500 mt-1">
                          {formErrors.description}
                        </p>
                      )}
                    </div>

                    {/* System Prompt - For flow agents with chat interface */}
                    {formData.agent_type === "flow" && (
                      <div>
                        <Label htmlFor="flow_system_prompt">
                          System Prompt (For Chat Mode)
                        </Label>
                        <Textarea
                          id="flow_system_prompt"
                          placeholder="You are an AI assistant that collects data conversationally. Extract structured data and validate before submitting..."
                          value={formData.system_prompt}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              system_prompt: e.target.value,
                            })
                          }
                          rows={8}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Instructions for the LLM on how to extract structured data
                          from conversation and handle missing fields (required for
                          chat interface mode)
                        </p>
                      </div>
                    )}

                    {/* Initial Message - For chat interface mode */}
                    <div>
                      <Label htmlFor="initial_message">Initial Message *</Label>
                      <Textarea
                        id="initial_message"
                        placeholder="Hi! I'm your assistant. I can help you with..."
                        value={formData.initial_message}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            initial_message: e.target.value,
                          });
                          if (formErrors.initial_message) {
                            setFormErrors({ ...formErrors, initial_message: "" });
                          }
                        }}
                        rows={4}
                        className={cn(
                          "font-mono text-sm",
                          formErrors.initial_message &&
                          "border-red-500 focus-visible:ring-red-500",
                        )}
                      />
                      {formErrors.initial_message && (
                        <p className="text-xs text-red-500 mt-1">
                          {formErrors.initial_message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Greeting shown when chat starts (only in chat interface
                        mode, not form/JSON/API modes)
                      </p>
                    </div>

                    {/* Model Selection */}
                    <div>
                      <Label htmlFor="model">AI Model</Label>
                      <Select
                        value={formData.model_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, model_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__default__">
                            Use Organization Default
                          </SelectItem>
                          {availableModels.map((model) => (
                            <SelectItem key={model.model_id} value={model.model_id}>
                              {model.display_name} ({model.provider})
                              {model.is_default && " - Default"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Choose which AI model powers this agent. Leave as default to
                        use your organization's default model.
                      </p>
                    </div>

                    {/* Avatar Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Avatar</Label>
                        <Button
                          type="button"
                          onClick={generateAvatarOptions}
                          size="sm"
                          variant="outline"
                        >
                          Generate More
                        </Button>
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                        {avatarOptions.map((option, index) => (
                          <div
                            key={index}
                            className={cn(
                              "cursor-pointer rounded-lg p-2 border-2 transition-all hover:shadow-md",
                              selectedAvatar.seed === option.seed
                                ? "border-purple-500 bg-purple-50 shadow-sm"
                                : "border-gray-200 hover:border-gray-300",
                            )}
                            onClick={() => setSelectedAvatar(option)}
                          >
                            <div
                              className="w-full aspect-square rounded-lg flex items-center justify-center"
                              style={{
                                background: `linear-gradient(135deg, ${option.colors[0]} 0%, ${option.colors[1]} 100%)`,
                              }}
                            >
                              <Avatar
                                size={40}
                                name={option.seed}
                                variant={option.variant as any}
                                colors={[...option.colors]}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      {avatarOptions.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Click &quot;Generate More&quot; to see avatar options
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    <div>
                      <Label>Tags</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add a tag..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addTag())
                          }
                        />
                        <Button type="button" onClick={addTag} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Visibility */}
                    <div>
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select
                        value={formData.visibility}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, visibility: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="organization">Organization</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Temperature</Label>
                        <Input
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={formData.configuration.temperature}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              configuration: {
                                ...formData.configuration,
                                temperature: parseFloat(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Max Tokens</Label>
                        <Input
                          type="number"
                          min="1"
                          max="8192"
                          value={formData.configuration.max_tokens}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              configuration: {
                                ...formData.configuration,
                                max_tokens: parseInt(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* System Prompt Step */}
                {currentStep === "prompt" && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="system_prompt">System Prompt *</Label>
                      <Textarea
                        id="system_prompt"
                        placeholder="You are an expert assistant that..."
                        value={formData.system_prompt}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            system_prompt: e.target.value,
                          });
                          if (formErrors.system_prompt) {
                            setFormErrors({ ...formErrors, system_prompt: "" });
                          }
                        }}
                        rows={12}
                        className={cn(
                          "font-mono text-sm",
                          formErrors.system_prompt &&
                          "border-red-500 focus-visible:ring-red-500",
                        )}
                      />
                      {formErrors.system_prompt && (
                        <p className="text-xs text-red-500 mt-1">
                          {formErrors.system_prompt}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        This defines your agent's behavior, personality, and
                        expertise
                      </p>
                    </div>
                  </div>
                )}

                {/* Examples Step */}
                {currentStep === "examples" && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Example Query</Label>
                          <Input
                            placeholder="What can you help me with?"
                            value={newExampleQuery.query}
                            onChange={(e) =>
                              setNewExampleQuery({
                                ...newExampleQuery,
                                query: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Expected Response</Label>
                          <Textarea
                            placeholder="I can help you with..."
                            value={newExampleQuery.expected_response}
                            onChange={(e) =>
                              setNewExampleQuery({
                                ...newExampleQuery,
                                expected_response: e.target.value,
                              })
                            }
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            placeholder="General capabilities example"
                            value={newExampleQuery.description}
                            onChange={(e) =>
                              setNewExampleQuery({
                                ...newExampleQuery,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={addExampleQuery}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Example
                        </Button>
                      </div>

                      {formData.example_queries.length > 0 && (
                        <div className="space-y-2">
                          {formData.example_queries.map((example, index) => (
                            <Card key={index} className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm mb-1">
                                    {example.query}
                                  </p>
                                  <p className="text-xs text-gray-600 mb-1">
                                    {example.expected_response}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-300">
                                    {example.description}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeExampleQuery(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Capabilities Step */}
                {currentStep === "capabilities" && (
                  <div className="space-y-4 mt-4">
                    <Alert className="bg-blue-50 border-blue-100 dark:bg-slate-800 ">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="dark:text-purple-400 ">
                        <strong>Simplified Tool Selection:</strong> Just check which
                        tools this agent can use. The agent's system prompt and
                        examples determine when and how tools are called. The LLM
                        automatically handles intent detection, parameter gathering,
                        and response formatting.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label className="text-base font-semibold">
                        Available Tools (Optional) ({formData.capabilities.length}{" "}
                        selected)
                      </Label>
                      {capabilities.length === 0 ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No capabilities available. Create capabilities first or
                            browse the marketplace.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-2">
                          {capabilities.map((capability) => {
                            const isEnabled = formData.capabilities.some(
                              (c) => c.capability_id === capability.id,
                            );
                            const isGlobal = (capability as any).is_global;

                            return (
                              <Card
                                key={capability.id}
                                className={cn(
                                  "p-4 cursor-pointer transition-all",
                                  isEnabled
                                    ? "bg-purple-60 border-x-green-500 shadow-sm"
                                    : "hover:bg-gray-50 dark:bg-[#2d3545]",
                                )}
                                onClick={() => toggleCapability(capability.id)}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={cn(
                                      "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                                      isEnabled
                                        ? "bg-purple-600 border-purple-600"
                                        : "border-gray-300",
                                    )}
                                  >
                                    {isEnabled && (
                                      <Check className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <Code className="h-4 w-4 text-gray-600 dark:text-green-500 flex-shrink-0" />
                                      <h4 className="font-semibold text-sm">
                                        {capability.name}
                                      </h4>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {capability.category}
                                      </Badge>
                                      {isGlobal && (
                                        <Badge className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                          <Sparkles className="h-2.5 w-2.5 mr-1" />
                                          Global
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-200 mb-2">
                                      {capability.description}
                                    </p>
                                    <div className="text-xs text-gray-500 dark:text-gray-300">
                                      <span className="font-medium">
                                        Parameters:
                                      </span>{" "}
                                      {capability.parameters
                                        .map((p) => p.name)
                                        .join(", ") || "None"}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('/library?tab=capabilities')
                    }}
                    className="w-full border-dashed"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Browse More Capabilities in Marketplace
                  </Button>
                </div> */}
                  </div>
                )}

                {/* Flow Builder Step */}
                {currentStep === "flow" && (
                  <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-[#1a1f2e]">
                    <div className="text-center max-w-lg mx-auto p-6">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                        Design Your Workflow
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        Use the visual flow builder to create your agent's logic. Drag and drop nodes, connect them, and test your workflow in real-time.
                      </p>

                      <Button
                        onClick={(e) => {
                          e.preventDefault()
                          setIsFlowBuilderOpen(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-8 py-6 text-base rounded-full transition-transform hover:scale-105 active:scale-95"
                      >
                        <GitBranch className="h-5 w-5 mr-2" />
                        Open Visual Flow Builder
                      </Button>

                      <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
                        {flowNodes.length > 0
                          ? `${flowNodes.length} nodes configured in this workflow`
                          : "No nodes configured yet"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Interface Step */}
                {currentStep === "interface" && (
                  <InterfaceConfigurator
                    agentId={selectedAgent?.id || ""}
                    agentName={formData.name}
                    agentType={formData.agent_type}
                    capabilities={capabilities}
                    agentCapabilities={formData.capabilities}
                    flowNodes={flowNodes}
                    initialConfig={{
                      interface_type: formData.interface_type,
                      interface_config: formData.interface_config,
                    }}
                    onSave={async (config) => {
                      setFormData({
                        ...formData,
                        interface_type: config.interface_type,
                        interface_config: config.interface_config,
                      });
                    }}
                  />
                )}
              </div>

              {/* Close Fragment for wizard content */}
            </>
          )}



          {/* Dialog Footer - Only show in normal mode */}
          {!isFlowOnlyMode && (
            <DialogFooter className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-2">
                  {/* Test Agent Button - Only show if agent is saved */}
                  {selectedAgent?.id && isLastStep && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (selectedAgent?.id) {
                          navigate(`/test-agent/${selectedAgent.id}`);
                        } else {
                          toast({
                            title: "Save Required",
                            description:
                              "Please save the agent first before testing",
                            variant: "default",
                            duration: 2000,
                          });
                        }
                      }}
                      className="gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Test Agent
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsCreateDialogOpen(false);
                      setIsEditDialogOpen(false);
                      setSelectedAgent(null);
                      resetForm();
                      setCurrentStep("basic");
                    }}
                  >
                    Cancel
                  </Button>

                  {/* Back Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      handleBack();
                    }}
                    disabled={isFirstStep}
                    className={cn(isFirstStep && "hidden")}
                  >
                    Back
                  </Button>

                  {/* Next/Create Button */}
                  {isLastStep ? (
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        console.log("Update/Create button clicked", {
                          isEditDialogOpen,
                          isLastStep,
                        });
                        if (isEditDialogOpen) {
                          console.log("Calling handleUpdateAgent...");
                          handleUpdateAgent();
                        } else {
                          console.log("Calling handleCreateAgent...");
                          handleCreateAgent();
                        }
                      }}
                      disabled={
                        isSaving ||
                        !formData.name.trim() ||
                        (formData.agent_type === "chat" &&
                          !formData.system_prompt.trim()) ||
                        (formData.agent_type === "flow" && flowNodes.length === 0)
                      }
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>{isEditDialogOpen ? "Update" : "Create"} Agent</>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNext();
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog >

      {/* Dedicated Flow Builder Modal */}
      <Dialog
        open={isFlowBuilderOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFlowBuilderOpen(false);
          }
        }}
      >
        <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 overflow-hidden bg-white dark:bg-[#0f1219] border-none [&>button]:hidden">
          {/* Sidebar Layout for Flow Builder */}
          {/* Main Content Area */}
          <div className="flex w-full h-full overflow-hidden relative">
            {/* Flow Canvas Area - Always visible but z-index changes */}
            <div className="absolute inset-0 z-0">
              <FlowCanvas
                key={selectedAgent?.id ?? 'new'}
                initialNodes={flowNodes}
                initialEdges={flowEdges}
                onNodesChange={setFlowNodes}
                onEdgesChange={setFlowEdges}
                agentId={selectedAgent?.id}
                onNodeSelect={(node) => {
                  console.log("Selected node:", node);
                  setSelectedFlowNode(node);
                  if (activeSidebarSection === 'flow') {
                    setIsSidebarCollapsed(false); // Open sidebar to show config
                  }
                }}
                onAddNodeClick={(position, sourceNodeId) => {
                  setNodeSelectorPosition(position);
                  setNodeSelectorSourceNode(sourceNodeId || null);
                  setShowNodeSelector(true);
                  setSelectedFlowNode(null);
                }}
                toolbarActions={
                  <div className="flex items-center gap-2 border-l pl-2 ml-2 border-gray-200 dark:border-gray-700">

                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      onClick={() => {
                        setIsFlowBuilderOpen(false);
                        toast({
                          title: "Flow Saved",
                          description: "Your changes have been applied.",
                          duration: 2000,
                        });
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save & Return
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsFlowBuilderOpen(false)}
                      className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Close
                    </Button>
                  </div>
                }
              />
            </div>

            {/* Node Selector Overlay */}
            {showNodeSelector && (
              <div className="absolute right-0 top-[61px] bottom-0 z-50 w-80 shadow-xl border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1e1e]">
                <NodeSelector
                  onNodeSelect={(nodeType) => {
                    // Add node logic
                    console.log('Node selected:', nodeType);
                    const newNode: FlowNodeType = {
                      id: `node-${Date.now()}`,
                      type: nodeType,
                      label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
                      config: {},
                      position: nodeSelectorPosition || { x: 100, y: 100 },
                    };
                    setFlowNodes((prev) => [...prev, newNode]);
                    if (nodeSelectorSourceNode) {
                      const newEdge: FlowEdge = {
                        id: `edge-${Date.now()}`,
                        source: nodeSelectorSourceNode,
                        target: newNode.id,
                      };
                      setFlowEdges((prev) => [...prev, newEdge]);
                    }
                    setShowNodeSelector(false);
                  }}
                  onClose={() => setShowNodeSelector(false)}
                  title={flowNodes.length === 0 ? "Start Workflow" : "Add Step"}
                  className="h-full border-0 rounded-none shadow-none"
                />
              </div>
            )}



            {/* Config Sidebar Overlay (Animated) */}
            <div
              className={cn(
                "absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-30",
                activeSidebarSection !== 'flow' ? "translate-x-0" : "translate-x-full"
              )}
            >
              {activeSidebarSection !== 'flow' && (
                <AgentConfigSidebar
                  section={activeSidebarSection}
                  formData={formData}
                  onUpdate={(field, value) => {
                    setFormData(prev => ({ ...prev, [field]: value }))
                  }}
                  onClose={() => setActiveSidebarSection('flow')}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
              )}
            </div>

            {/* Node Config Panel Overlay (Right Side) */}
            {selectedFlowNode && activeSidebarSection === 'flow' && (
              <div className="absolute right-0 top-[61px] bottom-0 w-80 bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-gray-800 shadow-xl z-20 overflow-y-auto">
                <NodeConfigPanel
                  node={selectedFlowNode}
                  onUpdate={handleNodeConfigUpdate}
                  onClose={() => setSelectedFlowNode(null)}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      < Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-emerald-600" />
              Import Agent from JSON
            </DialogTitle>
            <DialogDescription>
              Upload a JSON file or paste JSON content to quickly create an
              agent
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={importMethod}
            onValueChange={(v) => setImportMethod(v as "paste" | "upload")}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paste" className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Paste JSON
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="paste"
              className="flex-1 flex flex-col min-h-0 mt-4"
            >
              <div className="flex-1 flex flex-col min-h-0">
                <Label htmlFor="json-input" className="mb-2">
                  JSON Content
                </Label>
                <Textarea
                  id="json-input"
                  placeholder='Paste your agent JSON here...

Example:
{
  "name": "My Agent",
  "agent_type": "chat",
  "description": "Description here",
  "system_prompt": "System prompt...",
  "capabilities": [],
  "tags": ["test"]
}'
                  value={importJSON}
                  onChange={(e) => setImportJSON(e.target.value)}
                  className="flex-1 min-h-[400px] font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent
              value="upload"
              className="flex-1 flex flex-col items-center justify-center mt-4 border-2 border-dashed rounded-lg p-8"
            >
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload JSON File</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Click to browse or drag and drop your .json file here
                </p>
                <Button type="button" variant="outline">
                  <FileJson className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </label>
              {importJSON && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg w-full">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">
                      File loaded successfully!
                    </span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {importJSON.length} characters • Ready to import
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={processImportJSON}
              disabled={!importJSON.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <FileJson className="h-4 w-4 mr-2" />
              Import & Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Delete Confirmation Dialog */}
      < Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              {itemToDelete && (
                <>
                  Are you sure you want to delete{" "}
                  <strong className="text-gray-900">{itemToDelete.name}</strong>
                  ?
                  <br />
                  <br />
                  This {itemToDelete.type} will be moved to trash and can be
                  restored later.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setItemToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {itemToDelete?.type}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </div >
  );
}

export { WorkspacePage };
export default WorkspacePage;
