'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Check,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BackgroundStyle {
  type: 'solid' | 'gradient' | 'image'
  value: string // color hex, gradient CSS, or image URL
}

interface BackgroundCustomizerProps {
  currentBackground: BackgroundStyle
  onBackgroundChange: (background: BackgroundStyle) => void
  onClose?: () => void
}

// Predefined solid colors
const SOLID_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#F3F4F6' },
  { name: 'Soft Blue', value: '#EFF6FF' },
  { name: 'Soft Purple', value: '#F5F3FF' },
  { name: 'Soft Pink', value: '#FDF2F8' },
  { name: 'Soft Green', value: '#F0FDF4' },
  { name: 'Soft Yellow', value: '#FEFCE8' },
  { name: 'Soft Orange', value: '#FFF7ED' },
  { name: 'Dark', value: '#111827' },
  { name: 'Navy', value: '#1E293B' },
]

// Predefined gradients
const GRADIENTS = [
  { name: 'Ocean', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Spring', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'Cool Blue', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'Purple Dream', value: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)' },
  { name: 'Peach', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'Morning', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { name: 'Night', value: 'linear-gradient(135deg, #2e1437 0%, #7f2d56 100%)' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)' },
  { name: 'Lavender', value: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
]

// Predefined stock images
const STOCK_IMAGES = [
  { name: 'Abstract Waves', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1600&h=900&fit=crop' },
  { name: 'Gradient Mesh', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&h=900&fit=crop' },
  { name: 'Minimal Shapes', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1600&h=900&fit=crop' },
  { name: 'Soft Colors', url: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=1600&h=900&fit=crop' },
  { name: 'Gradient Blur', url: 'https://images.unsplash.com/photo-1557672199-6551ca5f3ab1?w=1600&h=900&fit=crop' },
  { name: 'Pastel Abstract', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1600&h=900&fit=crop' },
]

export function BackgroundCustomizer({
  currentBackground,
  onBackgroundChange,
  onClose
}: BackgroundCustomizerProps) {
  const [customColor, setCustomColor] = useState('#FFFFFF')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Convert to base64 for preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setUploadedImage(base64String)
      onBackgroundChange({
        type: 'image',
        value: base64String
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card className="w-full max-w-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Customize Background
          </h3>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="gradients" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Gradients
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Images
          </TabsTrigger>
        </TabsList>

        {/* Solid Colors Tab */}
        <TabsContent value="colors">
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {/* Predefined Colors */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Predefined Colors
                </Label>
                <div className="grid grid-cols-5 gap-3">
                  {SOLID_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => onBackgroundChange({ type: 'solid', value: color.value })}
                      className={cn(
                        'group relative rounded-xl overflow-hidden transition-all hover:scale-105',
                        currentBackground.type === 'solid' && currentBackground.value === color.value
                          ? 'ring-2 ring-blue-500 ring-offset-2'
                          : 'hover:ring-2 hover:ring-gray-300'
                      )}
                    >
                      <div
                        className="w-full h-16"
                        style={{ backgroundColor: color.value }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all">
                        {currentBackground.type === 'solid' && currentBackground.value === color.value && (
                          <div className="bg-white rounded-full p-1">
                            <Check className="h-4 w-4 text-blue-500" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-center py-1 bg-gray-50 text-gray-700">
                        {color.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Picker */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Custom Color
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-20 h-12 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#FFFFFF"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => onBackgroundChange({ type: 'solid', value: customColor })}
                    size="sm"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Gradients Tab */}
        <TabsContent value="gradients">
          <ScrollArea className="h-80">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Choose a Gradient
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {GRADIENTS.map((gradient) => (
                  <button
                    key={gradient.name}
                    onClick={() => onBackgroundChange({ type: 'gradient', value: gradient.value })}
                    className={cn(
                      'group relative rounded-xl overflow-hidden transition-all hover:scale-105',
                      currentBackground.type === 'gradient' && currentBackground.value === gradient.value
                        ? 'ring-2 ring-blue-500 ring-offset-2'
                        : 'hover:ring-2 hover:ring-gray-300'
                    )}
                  >
                    <div
                      className="w-full h-24"
                      style={{ background: gradient.value }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all">
                      {currentBackground.type === 'gradient' && currentBackground.value === gradient.value && (
                        <div className="bg-white rounded-full p-1">
                          <Check className="h-4 w-4 text-blue-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-center py-2 bg-gray-50 text-gray-700">
                      {gradient.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {/* Upload Custom Image */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Upload Custom Image
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="background-upload"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="background-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </label>
                </div>
                {uploadedImage && (
                  <div className="mt-3 relative rounded-lg overflow-hidden">
                    <img src={uploadedImage} alt="Uploaded" className="w-full h-32 object-cover" />
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setUploadedImage(null)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Images */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Stock Images
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {STOCK_IMAGES.map((image) => (
                    <button
                      key={image.url}
                      onClick={() => onBackgroundChange({ type: 'image', value: image.url })}
                      className={cn(
                        'group relative rounded-xl overflow-hidden transition-all hover:scale-105',
                        currentBackground.type === 'image' && currentBackground.value === image.url
                          ? 'ring-2 ring-blue-500 ring-offset-2'
                          : 'hover:ring-2 hover:ring-gray-300'
                      )}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-24 object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all">
                        {currentBackground.type === 'image' && currentBackground.value === image.url && (
                          <div className="bg-white rounded-full p-1">
                            <Check className="h-4 w-4 text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                        <p className="text-xs text-white font-medium">
                          {image.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Preview
        </Label>
        <div
          className="w-full h-24 rounded-lg border-2 border-gray-200"
          style={{
            background: currentBackground.type === 'solid' || currentBackground.type === 'gradient'
              ? currentBackground.value
              : undefined,
            backgroundImage: currentBackground.type === 'image' ? `url(${currentBackground.value})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      </div>
    </Card>
  )
}
