// frontend/src/components/chat/agents/AnalyticaChat.tsx
'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChatContext } from '@/context/chat-context'
import { useChatMessages } from '@/hooks/useChatMessages'
import { ChatLayout } from '../shared/ChatLayout'
import { AnalyticaHeader } from '../headers/AnalyticaHeader'
import { MessageList } from '../shared/MessageList'
import { ChatInput } from '../ChatInput'
import { BucketSelector } from '@/components/hub/BucketSelector'
import { AnalyticaSuggestionCards } from './AnalyticaSuggestionCards'
import { apiClient } from '@/lib/api'

interface AnalyticaChatProps {
  chatId: string | null
}

export function AnalyticaChat({ chatId }: AnalyticaChatProps) {
  const {
    selectedBucket,
    selectedBucketName,
    setSelectedBucket,
    setSelectedBucketName,
    showBucketSelector,
    setShowBucketSelector,
    sendMessage,
    isProcessing,
    isStreaming,
    stopStream
  } = useChatContext()

  const { messages, isLoading } = useChatMessages(chatId)

  // ✅ Fetch chat data to get bucket info
  const { data: chatData } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      if (!chatId) return null
      const response = await apiClient.getChat(chatId)
      return response.success ? response.data : null
    },
    enabled: !!chatId,
    staleTime: 300000, // 5 minutes
  })

  // ✅ Fetch buckets to get the bucket name
  const { data: bucketsData } = useQuery({
    queryKey: ['analytica-buckets'],
    queryFn: async () => {
      const response = await apiClient.getBuckets()
      return response.success ? response.data : []
    },
    staleTime: 300000,
  })

  // ✅ Fetch selected bucket details (including data_info for context-aware suggestions)
  const { data: bucketDetails } = useQuery({
    queryKey: ['analytica-bucket-details', selectedBucket],
    queryFn: async () => {
      if (!selectedBucket) return null
      const response = await apiClient.getBucket(selectedBucket)
      return response.success ? response.data : null
    },
    enabled: !!selectedBucket,
    staleTime: 300000,
  })

  // ✅ Fetch AI-generated suggestions for the bucket
  const { data: aiSuggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['analytica-bucket-suggestions', selectedBucket],
    queryFn: async () => {
      if (!selectedBucket) return []
      const response = await apiClient.getBucketSuggestions(selectedBucket)
      return response.success ? response.data : []
    },
    enabled: !!selectedBucket && !!bucketDetails?.data_info,
    staleTime: 600000, // 10 minutes - AI suggestions are expensive
    retry: 1, // Only retry once on failure
  })

  // ✅ Auto-load bucket from chat data when chat loads
  useEffect(() => {
    // The API might wrap the chat object inside a `chat` property
    const actualChat = (chatData as any)?.chat || chatData;
    const chatAny = actualChat as any;

    // Extract ID based on different possible backend formats
    const bId = chatAny?.bucket_id || actualChat?.bucketId || actualChat?.metadata?.bucket_id;

    if (actualChat && bId) {
      // 1. Set the ID if it's missing or different
      if (selectedBucket !== bId) {
        console.log('🔄 Loading bucket ID from chat data:', bId)
        setSelectedBucket(bId)
      }

      // 2. Set the Name if we have the list and the name hasn't been set for this Bucket yet
      if (bucketsData && bucketsData.length > 0) {
        // Find the bucket name from the buckets list
        const bucket = bucketsData.find(
          (b: any) => b.bucket_id === bId || b.id === bId
        )

        if (bucket && selectedBucketName !== bucket.name) {
          console.log('✅ Found bucket:', bucket.name)
          setSelectedBucketName(bucket.name)
        }
      }
    }
  }, [chatData, bucketsData, selectedBucket, selectedBucketName, setSelectedBucket, setSelectedBucketName])

  // ✅ Auto-open bucket selector for new chats
  useEffect(() => {
    // If it's a new chat (!chatId) and no bucket is selected yet,
    // automatically open the selector to prompt the user.
    if (!chatId && !selectedBucket) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowBucketSelector(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [chatId, selectedBucket, setShowBucketSelector])

  const handleSendMessage = async (content: string) => {
    // Check if data bucket is selected before sending
    if (!selectedBucket) {
      // Open bucket selector if not selected
      setShowBucketSelector(true)
      return // Don't send the message
    }

    // If bucket is selected, send message normally
    await sendMessage(content, chatId)
  }

  const handleBucketSelect = (bucket: any) => {
    setSelectedBucket(bucket.bucket_id)
    setSelectedBucketName(bucket.name)
    setShowBucketSelector(false)
  }

  // Show suggestion cards if bucket is selected and no messages yet
  const showInitialSuggestions = selectedBucket && messages.length === 0 && !isLoading

  // Debug logging
  useEffect(() => {
    console.log('📊 Analytica Chat State:', {
      selectedBucket,
      messagesCount: messages.length,
      isLoading,
      showInitialSuggestions,
      isProcessing,
      bucketDetails: bucketDetails,
      dataInfo: bucketDetails?.data_info,
      hasSchema: !!bucketDetails?.data_info?.schema,
      schemaTableName: bucketDetails?.data_info?.schema?.table_name,
      schemaPrimaryKeys: bucketDetails?.data_info?.schema?.primary_keys,
      schemaForeignKeys: bucketDetails?.data_info?.schema?.foreign_keys
    })
  }, [selectedBucket, messages.length, isLoading, showInitialSuggestions, isProcessing, bucketDetails])

  const handleSuggestionClick = async (query: string) => {
    await sendMessage(query, chatId)
  }

  const isEmpty = messages.length === 0 && !isProcessing

  const chatInput = (
    <ChatInput
      onSendMessage={handleSendMessage}
      isLoading={isProcessing || isStreaming}
      onStopStream={chatId ? () => stopStream?.(chatId) : undefined}
      placeholder={
        selectedBucketName
          ? `Ask Analytica about ${selectedBucketName}...`
          : messages.length > 0
            ? "Select a data bucket to continue..."
            : "Ask anything"
      }
      quickSuggestions={selectedBucket ? [
        { label: "Suggest Insights", action: "Suggest insights and analysis opportunities for this dataset" }
      ] : undefined}
    />
  )

  return (
    <>
      <ChatLayout
        header={
          <AnalyticaHeader
            bucket={selectedBucket}
            bucketName={selectedBucketName}
            onShowSelector={() => setShowBucketSelector(true)}
          />
        }
        messages={
          <MessageList
            messages={messages}
            isLoading={isLoading}
            chatId={chatId}
            agentType="analytica"
            agentDescription="Data Intelligence - Data analysis and visualization specialist with AI-powered insights"
            topChildren={
              /* Show initial suggestions at the top when bucket is selected */
              showInitialSuggestions && (
                <div className="mb-0">
                  <AnalyticaSuggestionCards
                    type="initial"
                    onSelectSuggestion={handleSuggestionClick}
                    dataInfo={bucketDetails?.data_info}
                    bucketName={selectedBucketName || undefined}
                    aiSuggestions={aiSuggestions}
                    suggestionsLoading={suggestionsLoading}
                  />
                </div>
              )
            }
            emptyStateInput={chatInput}
          >

            {/* Show follow-up suggestions after last message */}
            {messages.length > 0 && !isProcessing && messages[messages.length - 1]?.sender === 'assistant' && (
              <AnalyticaSuggestionCards
                type="followup"
                onSelectSuggestion={handleSuggestionClick}
                context={messages[messages.length - 1]?.content || ''}
                dataInfo={bucketDetails?.data_info}
                bucketName={selectedBucketName || undefined}
                aiSuggestions={aiSuggestions}
                suggestionsLoading={suggestionsLoading}
              />
            )}
          </MessageList>
        }
        input={isEmpty ? null : chatInput}
      />

      <BucketSelector
        open={showBucketSelector}
        onOpenChange={setShowBucketSelector}
        onSelect={handleBucketSelect}
        selectedBucketId={selectedBucket}
      />
    </>
  )
}
