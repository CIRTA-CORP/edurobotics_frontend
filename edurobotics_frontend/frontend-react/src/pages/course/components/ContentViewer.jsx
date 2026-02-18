/**
 * Content Viewer Component
 * 
 * Displays module content including videos (YouTube embeds), text, and resource links.
 * Handles different content types with appropriate rendering.
 * Tracks and displays content completion status.
 */

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { BookOpen, PlayCircle, FileText, Link2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'

const getContentIcon = (type) => {
  switch (type) {
    case 'video':
      return <PlayCircle className="w-5 h-5" />
    case 'text':
      return <FileText className="w-5 h-5" />
    case 'resource':
      return <Link2 className="w-5 h-5" />
    default:
      return <BookOpen className="w-5 h-5" />
  }
}

const isVideoUrl = (url) => {
  return url?.includes('youtube.com') || url?.includes('youtu.be') || url?.includes('vimeo.com')
}

const getYoutubeEmbedUrl = (url) => {
  if (!url) return null
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

export function ContentViewer({
  unit,
  allUnits,
  userId,
  isContentCompleted,
  markComplete,
  getUnitProgress,
  onUnitChange
}) {
  const [currentContentIndex, setCurrentContentIndex] = useState(0)
  const [navigating, setNavigating] = useState(false)

  const currentContent = unit?.contents?.[currentContentIndex]
  const hasPrevious = currentContentIndex > 0
  const hasNext = currentContentIndex < (unit?.contents?.length - 1 || 0)

  // Detectar si es el último contenido de la unidad actual
  const currentUnitIndex = allUnits?.findIndex(u => u.id === unit?.id) ?? -1
  const isLastUnit = currentUnitIndex === (allUnits?.length - 1)
  // Consideramos "último contenido" cuando no hay siguiente contenido en la unidad actual
  const isLastContent = !hasNext

  const handleNext = async () => {
    if (!currentContent || !userId) return

    setNavigating(true)

    // Marcar contenido actual como completado al avanzar
    await markComplete(currentContent.id)

    if (hasNext) {
      // Avanzar al siguiente contenido de la misma unidad
      setCurrentContentIndex(prev => prev + 1)
    } else {
      // Si es el último contenido, intentar ir a la siguiente unidad
      const currentUnitIndex = allUnits?.findIndex(u => u.id === unit.id)
      if (currentUnitIndex !== -1 && currentUnitIndex < (allUnits?.length - 1)) {
        const nextUnit = allUnits[currentUnitIndex + 1]
        if (nextUnit && onUnitChange) {
          onUnitChange(nextUnit.id)
          setCurrentContentIndex(0)
        }
      }
    }

    setNavigating(false)
  }

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentContentIndex(prev => prev - 1)
    } else {
      // Si es el primer contenido, ir a la unidad anterior
      const currentUnitIndex = allUnits?.findIndex(u => u.id === unit.id)
      if (currentUnitIndex > 0) {
        const previousUnit = allUnits[currentUnitIndex - 1]
        if (previousUnit && onUnitChange) {
          onUnitChange(previousUnit.id)
          setCurrentContentIndex((previousUnit.contents?.length || 1) - 1)
        }
      }
    }
  }

  const handleComplete = async () => {
    if (!currentContent || !userId) return

    setNavigating(true)
    await markComplete(currentContent.id)
    setNavigating(false)
  }

  // Reset index cuando cambia la unidad (en useEffect para evitar loop infinito)
  useEffect(() => {
    if (unit && currentContentIndex >= (unit.contents?.length || 0)) {
      setCurrentContentIndex(0)
    }
  }, [unit?.id, currentContentIndex, unit?.contents?.length])

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Contenido actual */}
      <div className="space-y-4">
        {!unit || !unit.contents || unit.contents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Selecciona una unidad para ver su contenido
              </p>
            </CardContent>
          </Card>
        ) : currentContent ? (
          <>
            <Card className={isContentCompleted?.(currentContent.id) ? 'border-green-200 bg-green-50/30' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${isContentCompleted?.(currentContent.id) ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {getContentIcon(currentContent.content_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{currentContent.content_type}</Badge>
                      <span className="text-sm text-gray-500">
                        Contenido {currentContentIndex + 1} de {unit.contents.length}
                      </span>
                      {isContentCompleted?.(currentContent.id) && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>

                    {currentContent.content_type === 'video' && isVideoUrl(currentContent.content_value) ? (
                      <div className="mt-4">
                        <div className="rounded-lg overflow-hidden bg-black" style={{ maxWidth: '640px' }}>
                          <div className="aspect-video">
                            <iframe
                              src={getYoutubeEmbedUrl(currentContent.content_value)}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      </div>
                    ) : currentContent.content_type === 'text' ? (
                      <div className="mt-2 prose prose-sm max-w-none">
                        <p className="text-gray-700">{currentContent.content_value}</p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <a
                          href={currentContent.content_value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-2"
                        >
                          <Link2 className="w-4 h-4" />
                          {currentContent.content_value}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navegación Anterior/Siguiente */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={!hasPrevious && (!allUnits || allUnits.findIndex(u => u.id === unit.id) === 0)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Anterior
                  </Button>

                  <div className="text-sm text-gray-600">
                    {currentContentIndex + 1} / {unit.contents.length}
                  </div>

                  {isLastContent ? (
                    <Button
                      onClick={handleComplete}
                      disabled={navigating || isContentCompleted?.(currentContent.id)}
                      className={isContentCompleted?.(currentContent.id) ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {navigating ? 'Guardando...' : (
                        isContentCompleted?.(currentContent.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completado
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {isLastUnit ? 'Completar curso' : 'Completar unidad'}
                          </>
                        )
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={navigating}
                    >
                      {navigating ? 'Guardando...' : (
                        <>
                          Siguiente
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}
