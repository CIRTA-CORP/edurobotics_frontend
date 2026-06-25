/**
 * RichTextEditor Component
 *
 * TipTap-based rich text editor for creating unit content.
 * Supports text formatting, image upload, YouTube embeds, and file attachments.
 * Replaces the old multi-block content creation system with a single
 * Notion-like editor experience.
 */

import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { useRef, useCallback, useEffect, useState } from 'react'
import { apiUploadFile } from '@/shared/services/api'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  ImageIcon, Youtube as YoutubeIcon, FileDown, LinkIcon,
  AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Minus, Loader2,
  PenLine, Eye, Columns2
} from 'lucide-react'

// ── Resizable Image Node View ──
function ResizableImageView({ node, updateAttributes, selected }) {
  const imgRef = useRef(null)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = imgRef.current?.offsetWidth || 300

    const onMouseMove = (moveEvent) => {
      const newWidth = Math.max(80, startWidth + (moveEvent.clientX - startX))
      updateAttributes({ width: newWidth })
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [updateAttributes])

  return (
    <NodeViewWrapper className="relative inline-block my-4" style={{ width: node.attrs.width ? `${node.attrs.width}px` : undefined }}>
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        width={node.attrs.width || undefined}
        className={`rounded-xl max-w-full block mx-auto ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
        draggable={false}
      />
      {selected && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-blue-500 rounded-sm cursor-se-resize border-2 border-white shadow-md hover:bg-blue-600"
          title="Arrastrar para redimensionar"
        />
      )}
    </NodeViewWrapper>
  )
}

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute('width'),
        renderHTML: (attrs) => attrs.width ? { width: attrs.width } : {},
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})

// ── Toolbar Button ──
function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 mx-0.5" />
}

// ── Toolbar ──
function EditorToolbar({ editor, onImageUpload, onFileUpload, uploading }) {
  if (!editor) return null

  const handleHeading = useCallback((level) => {
    const isActive = editor.isActive('heading', { level })
    if (isActive) {
      editor.chain().focus().setParagraph().run()
    } else {
      editor.chain().focus().clearNodes().setHeading({ level }).run()
    }
  }, [editor])

  const addYoutubeVideo = useCallback(() => {
    const url = window.prompt('URL del video de YouTube:')
    if (!url) return

    // Validate YouTube URL
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be')
    if (!isYoutube) {
      alert('Por favor ingresa una URL válida de YouTube')
      return
    }

    editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 })
  }, [editor])

  const addLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL del enlace:', previousUrl)

    if (url === null) return // Cancelled
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50/80">
      {/* Undo/Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Deshacer">
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rehacer">
        <Redo className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton 
        onClick={() => handleHeading(1)} 
        active={editor.isActive('heading', { level: 1 })} 
        title="Título 1 (H1)"
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => handleHeading(2)} 
        active={editor.isActive('heading', { level: 2 })} 
        title="Título 2 (H2)"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => handleHeading(3)} 
        active={editor.isActive('heading', { level: 3 })} 
        title="Título 3 (H3)"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita">
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva">
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado">
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinear izquierda">
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrar">
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinear derecha">
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cita">
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador">
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Link */}
      <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Enlace">
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>

      {/* Media */}
      <ToolbarButton onClick={onImageUpload} disabled={uploading} title="Insertar imagen">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
      </ToolbarButton>
      <ToolbarButton onClick={addYoutubeVideo} title="Video de YouTube">
        <YoutubeIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onFileUpload} disabled={uploading} title="Adjuntar archivo">
        <FileDown className="w-4 h-4" />
      </ToolbarButton>
    </div>
  )
}

// ── Main Editor Component ──
// Renders the editor HTML exactly as a student sees it in the lesson page.
// Mirrors ContentViewer's wrapper classes + the same sanitization, so the
// preview is faithful ("what you see is what they get").
function LivePreview({ html }) {
  const clean = sanitizeHtml(html)
  const isEmpty = !clean || clean === '<p></p>'
  return (
    <div className="min-h-[400px] overflow-auto px-6 py-5">
      {isEmpty ? (
        <p className="text-sm text-gray-400">La vista previa aparecerá aquí a medida que escribas…</p>
      ) : (
        <div
          className="rich-content prose prose-sm md:prose-base max-w-none w-full overflow-hidden text-gray-700 leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: clean }}
        />
      )}
    </div>
  )
}

const VIEW_MODES = [
  { id: 'edit', label: 'Editar', icon: PenLine },
  { id: 'split', label: 'Dividir', icon: Columns2 },
  { id: 'preview', label: 'Vista previa', icon: Eye },
]

export function RichTextEditor({ content, onSave, saving }) {
  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState('edit')
  const [liveHtml, setLiveHtml] = useState(content || '')

  const editor = useEditor({
    onUpdate: ({ editor }) => setLiveHtml(editor.getHTML()),
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'prose-paragraph',
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'prose-heading',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'prose-ul',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'prose-ol',
          },
        },
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { 
          target: '_blank', 
          rel: 'noopener noreferrer',
          class: 'text-blue-500 underline',
        },
      }),
      ResizableImage.configure({
        HTMLAttributes: { class: 'rounded-xl max-w-full mx-auto' },
      }),
      Youtube.configure({
        HTMLAttributes: { class: 'rounded-xl overflow-hidden' },
        width: 640,
        height: 360,
      }),
      Placeholder.configure({
        placeholder: 'Escribe el contenido de la unidad aquí... Usa la barra de herramientas para agregar títulos, imágenes, videos y más.',
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-6 py-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-2 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4',
      },
    },
  })

  // Update editor content when prop changes (e.g. switching units)
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML()
      // Only update if content actually changed (avoid cursor reset)
      if (currentContent !== content && !(currentContent === '<p></p>' && content === '')) {
        editor.commands.setContent(content || '')
        setLiveHtml(content || '')
      }
    }
  }, [content, editor])

  // ── Image upload handler ──
  const handleImageUpload = useCallback(() => {
    imageInputRef.current?.click()
  }, [])

  const handleImageFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    setUploading(true)
    try {
      const result = await apiUploadFile('/api/uploads', file)
      editor.chain().focus().setImage({ src: result.url, alt: file.name }).run()
    } catch (err) {
      alert(`Error al subir imagen: ${err.message}`)
    } finally {
      setUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }, [editor])

  // ── File upload handler (inserts download card as HTML) ──
  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    setUploading(true)
    try {
      const result = await apiUploadFile('/api/uploads', file)
      const ext = file.name.split('.').pop()?.toUpperCase() || ''

      // Insert a styled download block as HTML
      const downloadHtml = `
        <div data-file-attachment="true" style="margin: 1rem 0;">
          <a href="${result.url}" target="_blank" rel="noopener noreferrer" download
             style="display: flex; align-items: center; gap: 12px; padding: 16px; background: linear-gradient(135deg, #fff1f2, #fff7ed); border: 1px solid rgba(244,63,94,.2); border-radius: 12px; text-decoration: none; color: inherit;">
            <span style="width: 44px; height: 44px; border-radius: 8px; background: white; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(244,63,94,.15); flex-shrink: 0; font-size: 18px;"></span>
            <span>
              <span style="display: block; font-size: 14px; font-weight: 600; color: #1f2937;">Descargar ${file.name}</span>
              <span style="display: block; font-size: 12px; color: #6b7280;">${ext} • ${(file.size / 1024).toFixed(0)} KB</span>
            </span>
          </a>
        </div>
      `
      editor.chain().focus().insertContent(downloadHtml).run()
    } catch (err) {
      alert(`Error al subir archivo: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [editor])

  const handleSave = useCallback(() => {
    if (!editor || !onSave) return
    const html = editor.getHTML()
    onSave(html)
  }, [editor, onSave])

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* View mode switch (midudev-style live preview) */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon
            const active = viewMode === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
                title={mode.label}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            )
          })}
        </div>
        {viewMode !== 'edit' && (
          <span className="text-[11px] text-gray-400">Así lo verá el alumno</span>
        )}
      </div>

      {/* Editor + live preview */}
      <div className={viewMode === 'split' ? 'grid gap-4 lg:grid-cols-2' : ''}>
        {/* Editor pane — kept mounted (just hidden) so TipTap state survives */}
        <div className={`rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm ${viewMode === 'preview' ? 'hidden' : ''}`}>
          <EditorToolbar
            editor={editor}
            onImageUpload={handleImageUpload}
            onFileUpload={handleFileUpload}
            uploading={uploading}
          />
          <EditorContent editor={editor} />
        </div>

        {/* Preview pane */}
        {viewMode !== 'edit' && (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Vista previa
            </div>
            <LivePreview html={liveHtml} />
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || uploading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando...
          </>
        ) : (
          'Guardar Contenido'
        )}
      </button>
    </div>
  )
}
