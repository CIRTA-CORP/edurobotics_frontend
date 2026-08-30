/**
 * Landing Tab — CMS de la página de inicio (canvas AdminSitio, §8.5).
 *
 * La landing es una lista de bloques en el orden de la página: cada uno con su
 * interruptor en la cabecera y su contenido al desplegarlo. Lo que se apaga
 * desaparece de la página pública sin borrar su contenido.
 * Guarda en /api/landing y la landing pública lo refleja (defaults de respaldo).
 */
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Input } from '@/shared/components/input'
import { apiUploadFile } from '@/shared/services/api'
import { getLandingContent, saveLandingContent } from '@/features/landing/services/landing'
import { mergeLandingContent } from '@/features/landing/landingContent'
import { Check, ChevronDown, ExternalLink, ImageIcon, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'

const SERIF = { fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif" }

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      className={`relative inline-flex h-[23px] w-10 items-center rounded-full p-[3px] transition-colors ${value ? 'bg-[#10b981]' : 'bg-[#dcdbe4]'}`}
    >
      <span className={`inline-block h-[17px] w-[17px] transform rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-[17px]' : 'translate-x-0'}`} />
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-[11.5px] font-semibold text-[#55545f]">{label}</label>
      {children}
    </div>
  )
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="flex min-h-[76px] w-full resize-none rounded-[10px] border border-[#e3e2ea] bg-white px-3 py-2.5 text-[13.5px] leading-relaxed placeholder:text-gray-400 focus:border-[#4b46d6] focus:outline-none focus:ring-2 focus:ring-[#4b46d6]/20"
    />
  )
}

function BlockCard({ title, subtitle, visible, onVisibleChange, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e9e9ee] bg-white">
      <div className="flex items-center gap-4 px-[18px] py-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className={`text-[14px] font-semibold ${visible ? 'text-[#16151b]' : 'text-[#a9a8b4]'}`}>{title}</div>
            <div className="mt-1 text-[12.5px] text-[#a9a8b4]">{subtitle}</div>
          </div>
        </button>
        <Toggle value={visible} onChange={onVisibleChange} />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Cerrar bloque' : 'Abrir bloque'}
          className="flex-shrink-0 text-[#c4c3cd] transition-transform hover:text-[#16151b]"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
      </div>
      {open && <div className="space-y-4 border-t border-[#f2f1f6] px-[18px] py-5">{children}</div>}
    </div>
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

  // ── FAQ item helpers ──
  const faqItems = form.faq?.items || []
  const setFaqItems = (items) => update('faq', 'items', items)
  const updateFaqItem = (i, field, value) =>
    setFaqItems(faqItems.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)))
  const addFaqItem = () => setFaqItems([...faqItems, { question: '', answer: '' }])
  const removeFaqItem = (i) => setFaqItems(faqItems.filter((_, idx) => idx !== i))

  // ── Legal docs helper ──
  const updateLegal = (docKey, field, value) =>
    setForm((prev) => ({
      ...prev,
      legal: { ...prev.legal, [docKey]: { ...prev.legal?.[docKey], [field]: value } },
    }))

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
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">Sitio</span>
          <h1 className="mt-2 text-[28px] font-bold leading-[1.16] tracking-[-0.014em] text-[#16151b]" style={SERIF}>
            Página de inicio
          </h1>
          <p className="mt-2.5 max-w-[620px] text-[14px] text-[#55545f]">
            Cada bloque de la landing se enciende, se apaga y se edita aquí. Lo que apagues desaparece de la página pública sin borrar su contenido.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#e3e2ea] px-3.5 text-[12.5px] font-semibold text-[#55545f] transition-colors hover:border-[#c4c3cd] hover:text-[#16151b]"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.8} /> Ver la página
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-[11px] bg-[#16151b] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#2b2b26] disabled:opacity-60"
          >
            <Check className="h-4 w-4" strokeWidth={2.4} />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Lista de bloques en el orden de la página */}
      <div className="mt-6 flex max-w-[880px] flex-col gap-2.5">
        {/* Hero */}
        <BlockCard
          title="Hero"
          subtitle="Insignia, título, subtítulo y la foto del robot"
          defaultOpen
          visible={form.hero.visible}
          onVisibleChange={(v) => update('hero', 'visible', v)}
        >
          <Field label="Insignia">
            <Input value={form.hero.badge} onChange={(e) => update('hero', 'badge', e.target.value)} />
          </Field>
          <Field label="Título">
            <Input value={form.hero.title} onChange={(e) => update('hero', 'title', e.target.value)} />
            <p className="mt-2 text-[11.5px] text-[#a9a8b4]">
              Lo que pongas entre <span className="rounded bg-[#f4f3f8] px-1 py-0.5 font-mono">*asteriscos*</span> sale
              recuadrado en el hero. Mueve los asteriscos para destacar otra palabra.
            </p>
          </Field>
          <Field label="Subtítulo">
            <TextArea value={form.hero.subtitle} onChange={(e) => update('hero', 'subtitle', e.target.value)} />
          </Field>
          <Field label="Foto del robot (va dentro del mockup)">
            <div className="flex items-center gap-3.5">
              <div className="relative h-[110px] w-full max-w-[190px] flex-shrink-0 overflow-hidden rounded-[11px] border border-[#e9e9ee] bg-[#0a0a0c]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
                {form.hero.imageUrl && (
                  <img src={form.hero.imageUrl} alt="Robot del hero" className="absolute inset-0 h-full w-full object-cover" />
                )}
                {form.hero.imageUrl && (
                  <button
                    type="button"
                    onClick={() => update('hero', 'imageUrl', '')}
                    className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white hover:bg-black/80"
                    title="Quitar imagen"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div>
                {uploading ? (
                  <span className="inline-flex items-center gap-2 text-[12.5px] text-[#8b8a95]">
                    <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
                  </span>
                ) : (
                  <>
                    <label className="inline-flex h-[38px] cursor-pointer items-center gap-2 rounded-[10px] border border-[#e3e2ea] px-3.5 text-[12.5px] font-semibold text-[#55545f] transition-colors hover:border-[#c4c3cd] hover:text-[#16151b]">
                      {form.hero.imageUrl ? <ImageIcon className="h-4 w-4" /> : <Upload className="h-4 w-4" strokeWidth={1.8} />}
                      {form.hero.imageUrl ? 'Reemplazar imagen' : 'Subir imagen'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleHeroImage} disabled={uploading} />
                    </label>
                    <p className="mt-2 font-mono text-[10.5px] text-[#a9a8b4]">PNG, JPG, WEBP · máx 5 MB</p>
                  </>
                )}
              </div>
            </div>
          </Field>
        </BlockCard>

        {/* Estadísticas */}
        <BlockCard
          title="Estadísticas"
          subtitle="La franja de cifras bajo el hero"
          visible={form.stats.visible}
          onVisibleChange={(v) => update('stats', 'visible', v)}
        >
          <p className="text-[12.5px] text-[#a9a8b4]">Por ahora solo puedes mostrarla u ocultarla.</p>
        </BlockCard>

        {/* Simulador */}
        <BlockCard
          title="Simulador"
          subtitle="Título, subtítulo y las tres características"
          visible={form.simulator.visible}
          onVisibleChange={(v) => update('simulator', 'visible', v)}
        >
          <Field label="Título">
            <Input value={form.simulator.title} onChange={(e) => update('simulator', 'title', e.target.value)} />
          </Field>
          <Field label="Subtítulo">
            <TextArea value={form.simulator.subtitle} onChange={(e) => update('simulator', 'subtitle', e.target.value)} />
          </Field>
        </BlockCard>

        {/* Cursos */}
        <BlockCard
          title="Cursos"
          subtitle="Título y subtítulo del catálogo"
          visible={form.courses.visible}
          onVisibleChange={(v) => update('courses', 'visible', v)}
        >
          <Field label="Título">
            <Input value={form.courses.title} onChange={(e) => update('courses', 'title', e.target.value)} />
          </Field>
          <Field label="Subtítulo">
            <TextArea value={form.courses.subtitle} onChange={(e) => update('courses', 'subtitle', e.target.value)} />
          </Field>
        </BlockCard>

        {/* Cómo funciona */}
        <BlockCard
          title="Cómo funciona"
          subtitle="Los tres pasos"
          visible={form.howItWorks.visible}
          onVisibleChange={(v) => update('howItWorks', 'visible', v)}
        >
          <Field label="Título">
            <Input value={form.howItWorks.title} onChange={(e) => update('howItWorks', 'title', e.target.value)} />
          </Field>
        </BlockCard>

        {/* Para quién */}
        <BlockCard
          title="Para quién"
          subtitle="Estudiantes y universidades"
          visible={form.forWho.visible}
          onVisibleChange={(v) => update('forWho', 'visible', v)}
        >
          <p className="text-[12.5px] text-[#a9a8b4]">Por ahora solo puedes mostrarla u ocultarla.</p>
        </BlockCard>

        {/* Preguntas frecuentes */}
        <BlockCard
          title="Preguntas frecuentes"
          subtitle={`${faqItems.length} preguntas · se muestran en el orden de la lista`}
          defaultOpen
          visible={form.faq.visible}
          onVisibleChange={(v) => update('faq', 'visible', v)}
        >
          <Field label="Título">
            <Input value={form.faq.title} onChange={(e) => update('faq', 'title', e.target.value)} />
          </Field>
          <Field label="Subtítulo">
            <TextArea value={form.faq.subtitle} onChange={(e) => update('faq', 'subtitle', e.target.value)} />
          </Field>
          <div className="flex flex-col gap-2.5">
            {faqItems.map((it, i) => (
              <div key={i} className="flex items-start gap-3 rounded-[11px] border border-[#eceaf2] p-3.5">
                <span className="mt-1 grid h-6 w-6 flex-shrink-0 place-items-center rounded-[7px] bg-[#f4f3f8] font-mono text-[11px] font-bold text-[#8b8a95]">
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <input
                    value={it.question}
                    onChange={(e) => updateFaqItem(i, 'question', e.target.value)}
                    placeholder="Pregunta"
                    className="h-[38px] w-full rounded-[10px] border border-[#e3e2ea] px-3 text-[13.5px] font-semibold text-[#16151b] placeholder:font-normal placeholder:text-gray-400 focus:border-[#4b46d6] focus:outline-none focus:ring-2 focus:ring-[#4b46d6]/20"
                  />
                  <TextArea value={it.answer} onChange={(e) => updateFaqItem(i, 'answer', e.target.value)} placeholder="Respuesta" />
                </div>
                <button
                  type="button"
                  onClick={() => removeFaqItem(i)}
                  className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-lg text-[#c4c3cd] transition-colors hover:bg-[#b4425a]/[0.07] hover:text-[#b4425a]"
                  title="Eliminar pregunta"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFaqItem}
              className="inline-flex h-8 w-fit items-center gap-2 rounded-[9px] px-3 text-[12.5px] font-semibold text-[#7b7a86] transition-colors hover:bg-[#f4f3f8] hover:text-[#16151b]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Añadir pregunta
            </button>
          </div>
        </BlockCard>

        {/* CTA final */}
        <BlockCard
          title="Llamado a la acción final"
          subtitle="Título y subtítulo del cierre"
          visible={form.finalCta.visible}
          onVisibleChange={(v) => update('finalCta', 'visible', v)}
        >
          <Field label="Título">
            <Input value={form.finalCta.title} onChange={(e) => update('finalCta', 'title', e.target.value)} />
          </Field>
          <Field label="Subtítulo">
            <TextArea value={form.finalCta.subtitle} onChange={(e) => update('finalCta', 'subtitle', e.target.value)} />
          </Field>
        </BlockCard>

        {/* Páginas legales */}
        <BlockCard
          title="Páginas legales"
          subtitle="Términos, Privacidad y Cookies"
          visible
          onVisibleChange={() => {}}
        >
          <p className="rounded-[10px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-700">
            Completa los datos marcados como <strong>por completar</strong> (razón social, RUT, dirección, representante legal).
            En el texto, una línea que empieza con <strong>## </strong> se muestra como título de sección.
          </p>
          <div className="space-y-3">
            {[
              { key: 'terminos', label: 'Términos y Condiciones' },
              { key: 'privacidad', label: 'Política de Privacidad' },
              { key: 'cookies', label: 'Política de Cookies' },
            ].map((doc) => (
              <div key={doc.key} className="space-y-3 rounded-[11px] border border-[#eceaf2] p-3.5">
                <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">{doc.label}</p>
                <Field label="Título">
                  <Input
                    value={form.legal?.[doc.key]?.title || ''}
                    onChange={(e) => updateLegal(doc.key, 'title', e.target.value)}
                  />
                </Field>
                <Field label="Contenido">
                  <TextArea
                    rows={12}
                    value={form.legal?.[doc.key]?.body || ''}
                    onChange={(e) => updateLegal(doc.key, 'body', e.target.value)}
                  />
                </Field>
              </div>
            ))}
          </div>
        </BlockCard>
      </div>
    </div>
  )
}
