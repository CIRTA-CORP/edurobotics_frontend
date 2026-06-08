/**
 * Landing Tab — CMS de la página de inicio.
 *
 * Permite a la directora editar los textos de cada sección, mostrar/ocultar
 * secciones completas y subir la imagen del hero. Guarda en /api/landing y la
 * landing pública lo refleja (con los defaults como respaldo).
 */
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/card'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'
import { apiUploadFile } from '@/shared/services/api'
import { getLandingContent, saveLandingContent } from '@/features/landing/services/landing'
import { mergeLandingContent } from '@/features/landing/landingContent'
import { Save, Eye, EyeOff, ImageIcon, Upload, X, Loader2, ExternalLink } from 'lucide-react'

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function SectionCard({ title, visible, onVisibleChange, children }) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2">
            {visible ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
            <span className="text-xs text-gray-500">{visible ? 'Visible' : 'Oculta'}</span>
            <Toggle value={visible} onChange={onVisibleChange} />
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</label>
      {children}
    </div>
  )
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="flex min-h-[80px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    />
  )
}

export function LandingTab() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['landing-content'],
    queryFn: getLandingContent,
    staleTime: 30_000,
  })

  const [form, setForm] = useState(() => mergeLandingContent())
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Sincronizar el formulario cuando llega el contenido guardado
  useEffect(() => {
    if (data) setForm(mergeLandingContent(data))
  }, [data])

  const update = (section, field, value) =>
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }))

  const handleHeroImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await apiUploadFile('/api/uploads', file)
      update('hero', 'imageUrl', result.url)
      toast.success('Imagen subida')
    } catch (error) {
      toast.error(error.message || 'Error al subir la imagen')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveLandingContent(form)
      // Refrescar la landing pública (misma queryKey)
      queryClient.invalidateQueries({ queryKey: ['landing-content'] })
      toast.success('Landing actualizada')
    } catch (error) {
      toast.error(error.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-gray-400">Cargando contenido…</div>
  }

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Página de inicio (Landing)</h2>
          <p className="text-sm text-gray-500">Edita los textos, muestra u oculta secciones y cambia la imagen del hero.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-4 w-4" /> Ver landing
            </Button>
          </a>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4" />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      {/* Hero */}
      <SectionCard title="Hero (sección principal)" visible={form.hero.visible} onVisibleChange={(v) => update('hero', 'visible', v)}>
        <Field label="Etiqueta superior">
          <Input value={form.hero.badge} onChange={(e) => update('hero', 'badge', e.target.value)} />
        </Field>
        <Field label="Título principal">
          <Input value={form.hero.title} onChange={(e) => update('hero', 'title', e.target.value)} />
        </Field>
        <Field label="Subtítulo">
          <TextArea value={form.hero.subtitle} onChange={(e) => update('hero', 'subtitle', e.target.value)} />
        </Field>
        <Field label="Imagen del hero (opcional)">
          {form.hero.imageUrl ? (
            <div className="relative overflow-hidden rounded-lg border border-gray-200">
              <img src={form.hero.imageUrl} alt="Hero" className="max-h-48 w-full object-cover" />
              <button
                type="button"
                onClick={() => update('hero', 'imageUrl', '')}
                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                title="Quitar imagen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-400 transition-colors hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-500">
              {uploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs font-medium">Subiendo…</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="h-5 w-5" />
                    <Upload className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium">Subir imagen (reemplaza el mockup)</span>
                  <span className="text-[10px] text-gray-400">PNG, JPG, WEBP · máx 5 MB</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleHeroImage} disabled={uploading} />
            </label>
          )}
        </Field>
      </SectionCard>

      {/* Estadísticas */}
      <SectionCard title="Estadísticas" visible={form.stats.visible} onVisibleChange={(v) => update('stats', 'visible', v)}>
        <p className="text-xs text-gray-400">Banda con las cifras destacadas. Por ahora solo puedes mostrarla u ocultarla.</p>
      </SectionCard>

      {/* Simulador */}
      <SectionCard title="Sección Simulador" visible={form.simulator.visible} onVisibleChange={(v) => update('simulator', 'visible', v)}>
        <Field label="Título">
          <Input value={form.simulator.title} onChange={(e) => update('simulator', 'title', e.target.value)} />
        </Field>
        <Field label="Subtítulo">
          <TextArea value={form.simulator.subtitle} onChange={(e) => update('simulator', 'subtitle', e.target.value)} />
        </Field>
      </SectionCard>

      {/* Cursos */}
      <SectionCard title="Sección Cursos" visible={form.courses.visible} onVisibleChange={(v) => update('courses', 'visible', v)}>
        <Field label="Título">
          <Input value={form.courses.title} onChange={(e) => update('courses', 'title', e.target.value)} />
        </Field>
        <Field label="Subtítulo">
          <TextArea value={form.courses.subtitle} onChange={(e) => update('courses', 'subtitle', e.target.value)} />
        </Field>
      </SectionCard>

      {/* Cómo funciona */}
      <SectionCard title="Sección Cómo funciona" visible={form.howItWorks.visible} onVisibleChange={(v) => update('howItWorks', 'visible', v)}>
        <Field label="Título">
          <Input value={form.howItWorks.title} onChange={(e) => update('howItWorks', 'title', e.target.value)} />
        </Field>
      </SectionCard>

      {/* Para quién */}
      <SectionCard title="Sección Para quién (estudiantes / universidades)" visible={form.forWho.visible} onVisibleChange={(v) => update('forWho', 'visible', v)}>
        <p className="text-xs text-gray-400">Tarjetas para estudiantes y universidades. Por ahora solo puedes mostrarla u ocultarla.</p>
      </SectionCard>

      {/* CTA final */}
      <SectionCard title="Llamado a la acción final" visible={form.finalCta.visible} onVisibleChange={(v) => update('finalCta', 'visible', v)}>
        <Field label="Título">
          <Input value={form.finalCta.title} onChange={(e) => update('finalCta', 'title', e.target.value)} />
        </Field>
        <Field label="Subtítulo">
          <TextArea value={form.finalCta.subtitle} onChange={(e) => update('finalCta', 'subtitle', e.target.value)} />
        </Field>
      </SectionCard>
    </div>
  )
}
