'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { apiClient, AegisUploadRequest } from '@/lib/api'

export interface FileUploadState {
  isUploading: boolean
  uploadProgress: number
  fileName: string
  fileSize?: number
  fileType?: string
}

export function useFileUpload() {
  const [uploadState, setUploadState] = useState<FileUploadState | null>(null)
  const { toast } = useToast()

  const uploadFile = useCallback(async (
    file: File,
    message: string,
    chatId: string
  ) => {
    if (!chatId) {
      toast({
        title: 'Error',
        description: 'Please create a chat first before uploading files',
        variant: 'destructive',
        duration: 2000
      })
      return
    }

    try {
      console.log('📁 Starting file upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        chatId
      })

      setUploadState({
        isUploading: true,
        uploadProgress: 0,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })

      // Convert file to base64
      const base64Content = await apiClient.convertFileToBase64(file)
      
      setUploadState(prev => prev ? { ...prev, uploadProgress: 25 } : null)

      const uploadRequest: AegisUploadRequest = {
        message: message,
        filename: file.name,
        content: base64Content,
        mime_type: file.type,
        chat_id: chatId,
        tool: 'data_analyzer',
        subtool: 'auto',
        auto_process: true,
        temperature: 0.7
      }

      setUploadState(prev => prev ? { ...prev, uploadProgress: 50 } : null)

      const response = await apiClient.uploadFileToAegis(uploadRequest)

      setUploadState(prev => prev ? { ...prev, uploadProgress: 75 } : null)

      if (response.success && response.data) {
        console.log('✅ File upload successful')

        setUploadState(prev => prev ? { ...prev, uploadProgress: 100 } : null)

        toast({
          title: 'File Analysis Complete',
          description: `${file.name} has been analyzed successfully`,
          duration: 2000
        })

        setTimeout(() => {
          setUploadState(null)
        }, 2000)

        return response.data
      } else {
        throw new Error(response.error || 'File upload failed')
      }

    } catch (error) {
      console.error('❌ File upload failed:', error)
      
      setUploadState(null)
      
      toast({
        title: 'Upload Failed', 
        description: `Failed to upload ${file.name}`,
        variant: 'destructive',
        duration: 2000
      })
      
      throw error
    }
  }, [toast])

  const clearUploadState = useCallback(() => {
    setUploadState(null)
  }, [])

  return {
    uploadState,
    uploadFile,
    clearUploadState,
    isUploading: uploadState?.isUploading || false
  }
}