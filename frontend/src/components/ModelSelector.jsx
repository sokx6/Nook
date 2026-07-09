import { useState, useEffect, useRef } from 'react'

export default function ModelSelector({ model, onChange }) {
  const [models, setModels] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/models')
      .then((res) => res.json())
      .then((data) => {
        const list = []
        for (const item of data) {
          list.push(item.id || item.name || item.model || item)
        }
        setModels(list)
        if (model === null && list.length > 0) {
          onChange(list[0])
        }
      })
      .catch(() => {
        setModels([])
      })
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 rounded border border-gray-600 px-3 py-1 text-sm hover:bg-gray-800"
      >
        <span className="h-2 w-2 rounded-full bg-green-500"></span>
        {model ? model : 'Select model'}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded border border-gray-600 bg-gray-900 shadow">
          {models.length === 0 && (
            <p className="p-3 text-center text-sm text-gray-400">
              No models available. Is Ollama running?
            </p>
          )}
          {models.map((m) => (
            <button
              key={m}
              onClick={() => {
                onChange(m)
                setShowDropdown(false)
              }}
              className={
                'block w-full px-3 py-2 text-left text-sm hover:bg-gray-700 ' +
                (model === m ? 'bg-gray-700' : '')
              }
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
