'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Grid3x3, Grid2x2, LayoutGrid, List, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type GridSize = 'compact' | 'normal' | 'large'

interface LayoutCustomizerProps {
  currentGridSize: GridSize
  onGridSizeChange: (size: GridSize) => void
  onClose?: () => void
}

const GRID_SIZES = [
  {
    id: 'compact' as GridSize,
    name: 'Compact',
    description: '8 columns - More agents visible',
    icon: Grid3x3,
    preview: (
      <div className="grid grid-cols-8 gap-0.5 h-16">
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-sm" />
        ))}
      </div>
    )
  },
  {
    id: 'normal' as GridSize,
    name: 'Normal',
    description: '5 columns - Balanced view',
    icon: Grid2x2,
    preview: (
      <div className="grid grid-cols-5 gap-1 h-16">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded" />
        ))}
      </div>
    )
  },
  {
    id: 'large' as GridSize,
    name: 'Large',
    description: '3 columns - More details',
    icon: LayoutGrid,
    preview: (
      <div className="grid grid-cols-3 gap-2 h-16">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg" />
        ))}
      </div>
    )
  }
]

export function LayoutCustomizer({
  currentGridSize,
  onGridSizeChange,
  onClose
}: LayoutCustomizerProps) {
  return (
    <Card className="w-full max-w-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Customize Layout
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

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Grid Size
          </Label>
          <div className="space-y-3">
            {GRID_SIZES.map((gridSize) => {
              const Icon = gridSize.icon
              const isSelected = currentGridSize === gridSize.id

              return (
                <button
                  key={gridSize.id}
                  onClick={() => onGridSizeChange(gridSize.id)}
                  className={cn(
                    'w-full rounded-xl border-2 p-4 transition-all hover:shadow-md text-left',
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      )}>
                        <Icon className={cn(
                          "h-5 w-5",
                          isSelected ? 'text-blue-600' : 'text-gray-600'
                        )} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {gridSize.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {gridSize.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grid Preview */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    {gridSize.preview}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Additional Options */}
        <div className="pt-4 border-t border-gray-200">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Tips
          </Label>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Drag and drop agents to rearrange them</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Pin your favorite agents to keep them at the top</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Use Cmd/Ctrl + K to quickly search for agents</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
