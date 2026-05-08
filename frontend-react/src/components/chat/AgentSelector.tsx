// frontend/src/components/chat/AgentSelector.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AGENT_CONFIGS, TOOLS } from '@/lib/constants'
import type { AgentType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Brain, Zap, Target, TrendingUp, Code, Users, MessageSquare, Search, Lightbulb } from 'lucide-react'
import Avatar from 'boring-avatars'

interface AgentSelectorProps {
  selectedAgent: AgentType
  onAgentChange: (agent: AgentType) => void
  selectedTool: string
  onToolChange: (tool: string) => void
  selectedSubtool: string
  onSubtoolChange: (subtool: string) => void
}

export function AgentSelector({
  selectedAgent,
  onAgentChange,
  selectedTool,
  onToolChange,
  selectedSubtool,
  onSubtoolChange,
}: AgentSelectorProps) {
  const agentConfig = AGENT_CONFIGS[selectedAgent as keyof typeof AGENT_CONFIGS] || AGENT_CONFIGS.sophia
  const availableSubtools = TOOLS[selectedTool as keyof typeof TOOLS]?.subtools || {}

  const getSubtoolIcon = (subtoolKey: string) => {
    const iconMap = {
      comprehensive: <Brain className="h-4 w-4" />,
      quick: <Zap className="h-4 w-4" />,
      standard: <Target className="h-4 w-4" />,
      market_analysis: <TrendingUp className="h-4 w-4" />,
      competitive_analysis: <Users className="h-4 w-4" />,
      technical_review: <Code className="h-4 w-4" />,
      default: <MessageSquare className="h-4 w-4" />,
      creative: <Lightbulb className="h-4 w-4" />,
      analytical: <Brain className="h-4 w-4" />,
      conversational: <MessageSquare className="h-4 w-4" />,
      detailed: <Search className="h-4 w-4" />,
    }
    return iconMap[subtoolKey as keyof typeof iconMap] || <Target className="h-4 w-4" />
  }

  return (
    <div className="min-h-screen bg-page-blush">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 border border-enterprise-coral bg-gradient-coral-mint flex items-center justify-center shadow-subtle-coral overflow-hidden" style={{ borderRadius: '6px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <Avatar
                  size={32}
                  name="Mentis"
                  variant="marble"
                  colors={['#fcb1a6', '#a8edea', '#fc9291', '#89d4cf']}
                  square={true}
                />
              </div>
            </div>
            <h1 className="text-3xl font-semibold text-gradient-coral">
              Mentis
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">
            Choose Your AI Assistant
          </p>
          <p className="text-sm text-gray-500">
            Select the perfect AI agent for your research and knowledge needs
          </p>
        </div>

        {/* Agent Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {Object.entries(AGENT_CONFIGS).map(([key, config]) => (
            <Card
              key={key}
              className={cn(
                "relative p-8 cursor-pointer transition-all duration-200 border hover:shadow-subtle-coral group",
                selectedAgent === key 
                  ? "card-enterprise-coral shadow-subtle-coral" 
                  : "border-enterprise-coral bg-white/80 backdrop-blur-sm hover-subtle-coral"
              )}
              onClick={() => onAgentChange(key as AgentType)}
            >
              {/* Selection indicator */}
              {selectedAgent === key && (
                <div className="absolute top-4 right-4">
                  <div className="w-5 h-5 bg-gradient-coral-mint rounded-full flex items-center justify-center border border-enterprise-coral">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-14 h-14 border shadow-minimal-coral transition-transform group-hover:scale-105 overflow-hidden",
                  config.name === 'Sophia' ? "border-enterprise-lavender bg-gradient-lavender-citrus" : "border-enterprise-coral bg-gradient-coral-mint"
                )} style={{ borderRadius: '8px' }}>
                  <div className="w-full h-full flex items-center justify-center" style={{
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <Avatar
                      size={40}
                      name={config.name}
                      variant={config.variant}
                      colors={[...config.colors]}
                      square={true}
                    />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {config.name}
                    </h3>
                    {key === 'aegis' && (
                      <Badge className="bg-gradient-coral-mint text-gray-700 text-xs px-2 py-1 border-0">
                        <Brain className="h-3 w-3 mr-1" />
                        Research
                      </Badge>
                    )}
                    {key === 'sophia' && (
                      <Badge className="bg-gradient-lavender-citrus text-gray-700 text-xs px-2 py-1 border-0">
                        <Lightbulb className="h-3 w-3 mr-1" />
                        Knowledge
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {config.description}
                  </p>
                  
                  {/* Features list */}
                  <div className="space-y-2">
                    {key === 'aegis' ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Search className="h-4 w-4 text-orange-500" />
                          <span>Comprehensive web research</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <TrendingUp className="h-4 w-4 text-cyan-500" />
                          <span>Market analysis & insights</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Brain className="h-4 w-4 text-coral-500" />
                          <span>Downloadable reports</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MessageSquare className="h-4 w-4 text-purple-400" />
                          <span>Knowledge base queries</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Lightbulb className="h-4 w-4 text-yellow-400" />
                          <span>Intelligent responses</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Brain className="h-4 w-4 text-pink-400" />
                          <span>Creative assistance</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Mode Selection */}
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm border border-enterprise-coral">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select Mode
            </h3>
            <p className="text-sm text-gray-600">
              Choose how you want to interact with {(AGENT_CONFIGS[selectedAgent as keyof typeof AGENT_CONFIGS] || AGENT_CONFIGS.sophia).name}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              variant={selectedTool === 'chat' ? 'default' : 'outline'}
              className={cn(
                "h-16 flex flex-col gap-2 transition-all duration-200",
                selectedTool === 'chat' 
                  ? "btn-gradient-peach text-gray-700 border-0" 
                  : "hover-subtle-coral border-enterprise-coral"
              )}
              onClick={() => onToolChange('chat')}
            >
              <MessageSquare className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Chat Mode</div>
                <div className="text-xs opacity-80">Quick conversations</div>
              </div>
            </Button>
            
            <Button
              variant={selectedTool === 'research' ? 'default' : 'outline'}
              className={cn(
                "h-16 flex flex-col gap-2 transition-all duration-200",
                selectedTool === 'research' 
                  ? "btn-gradient-coral text-gray-700 border-0" 
                  : "hover-subtle-coral border-enterprise-coral"
              )}
              onClick={() => onToolChange('research')}
            >
              <Search className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Research Mode</div>
                <div className="text-xs opacity-80">Deep analysis</div>
              </div>
            </Button>
          </div>

          {/* Research Type Selection */}
          {selectedTool === 'research' && (
            <div className="border-t border-enterprise-coral pt-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Research Type</h4>
                <p className="text-sm text-gray-600">
                  Choose the depth and focus of your research
                </p>
              </div>
              
              <Select value={selectedSubtool} onValueChange={onSubtoolChange}>
                <SelectTrigger className="h-12 bg-gradient-to-r from-orange-50 to-cyan-50 border-enterprise-coral rounded-lg">
                  <div className="flex items-center gap-3">
                    {getSubtoolIcon(selectedSubtool)}
                    <SelectValue placeholder="Select research type" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border-enterprise-coral">
                  {Object.entries(availableSubtools).map(([key, description]) => (
                    <SelectItem key={key} value={key} className="focus:bg-gradient-to-r focus:from-orange-50 focus:to-cyan-50">
                      <div className="flex items-center gap-3 py-2">
                        {getSubtoolIcon(key)}
                        <div>
                          <div className="font-medium capitalize">
                            {key.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </Card>

        {/* Ready State */}
        <Card className="p-6 bg-gradient-blush-lagoon border border-enterprise-coral">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-enterprise-coral bg-gradient-cotton-cloud flex items-center justify-center shadow-minimal-coral overflow-hidden" style={{ borderRadius: '6px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <Avatar
                  size={32}
                  name="ready"
                  variant="marble"
                  colors={['#fde2ff', '#d0fcf7', '#f5d7ff', '#b8f5ed']}
                  square={true}
                />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                Ready to Start
              </h4>
              <p className="text-sm text-gray-700">
                {selectedTool === 'research'
                  ? `${(AGENT_CONFIGS[selectedAgent as keyof typeof AGENT_CONFIGS] || AGENT_CONFIGS.sophia).name} is ready for comprehensive research with ${selectedSubtool.replace('_', ' ')} analysis`
                  : `${(AGENT_CONFIGS[selectedAgent as keyof typeof AGENT_CONFIGS] || AGENT_CONFIGS.sophia).name} is ready for conversation and quick assistance`
                }
              </p>
            </div>
            <div className="ml-auto">
              <Badge className="bg-gradient-to-r from-emerald-200 to-teal-200 text-emerald-800 border-0">
                <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full mr-2 animate-pulse-coral"></div>
                Online
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}