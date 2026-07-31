import { useState } from 'react'
import { uploadImage } from '../lib/db.js'
import { useToast } from '../context/ToastContext.jsx'
import { Plus, Trash } from './Icons.jsx'

const MAX_MB = 5

// Image picker used by every admin form. Uploads the chosen file to the public
// `images` Supabase Storage bucket and stores only the resulting URL — so the
// photo is served from a CDN, shared across devices, and never bloats a table
// row (or the browser's localStorage) the way an inline base64 image would.
export default function ImageField({
  value,
  onChange,
  folder = 'menu',
  label = 'Image',
  hint = 'Upload from your device or paste a URL.',
}) {
  const toast = useToast()
  const [uploading, setUploading] = useState(false)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Image is too large (max ${MAX_MB} MB)`)
      return
    }
    setUploading(true)
    try {
      onChange(await uploadImage(file, folder))
      toast.success('Image uploaded')
    } catch (err) {
      console.error('[image] upload failed:', err)
      toast.error('Upload failed — check your connection or paste a URL instead.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label
          className={`btn-outline flex-none whitespace-nowrap px-4 py-3 text-sm ${
            uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'
          }`}
        >
          {uploading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              Uploading…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Upload Image
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={onFile}
          />
        </label>
        <input
          className="input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste an image URL"
        />
      </div>
      <p className="mt-1 text-xs text-charcoal/40">{hint}</p>

      {value && (
        <div className="relative mt-3">
          <img
            src={value}
            alt="preview"
            className="h-36 w-full rounded-xl object-cover ring-1 ring-black/5"
            onLoad={(e) => (e.currentTarget.style.display = 'block')}
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 shadow ring-1 ring-black/5 transition hover:bg-red-50"
            aria-label="Remove image"
            title="Remove image"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
