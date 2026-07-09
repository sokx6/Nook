import { useState, useEffect, useRef } from 'react'

export default function ModelSelector({ model, onChange }) {
  const [models, setModels] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/models')
      .then((r) => r.json())
      .then((data) => {
        const list = (Array.isArray(data) ? data : []).map((m) => m.id ?? m.name ?? m.model ?? m)
        setModels(list)
        if (model === null && list.length > 0) onChange(list[0])
      })
      .catch(() => setModels([]))
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded border border-gray-600 px-3 py-1 text-sm hover:bg-gray-800"
      >
        <span className="h-2 w-2 rounded-full bg-green-500" />
        {model ? models.find((m) => m === model) ?? model : 'Select model'}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded border border-gray-600 bg-gray-900 shadow">
          {models.length === 0 ? (
            <p className="p-3 text-center text-sm text-gray-400">
              No models available. Is Ollama running?
            </p>
          ) : (
            models.map((m) => (
              <button
                key={m}
                onClick={() => { onChange(m); setOpen(false) }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-700 ${model === m ? 'bg-gray-700' : ''}`}
              >
                {m}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}