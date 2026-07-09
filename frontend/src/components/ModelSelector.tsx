import React, { useState, useEffect, useRef } from 'react';

interface Props {
  model: string | null;
  onChange: (model: string) => void;
}

interface ModelItem {
  id: string;
  name: string;
  provider: string;
}

export default function ModelSelector({ model, onChange }: Props) {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/models')
      .then((res) => res.json())
      .then((data) => setModels(data ?? []))
      .catch(() => setModels([]));
  }, []);

  useEffect(() => {
    if (models.length > 0 && model === null) {
      onChange(models[0].id);
    }
  }, [models, model, onChange]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = models.find((m) => m.id === model);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-800"
      >
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span>{selected ? selected.name : 'Select model'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-600 bg-gray-900 shadow-lg">
          {models.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-gray-400">
              No models available. Is Ollama running?
            </p>
          ) : (
            models.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onChange(m.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-700 ${
                  model === m.id ? 'bg-gray-700' : ''
                }`}
              >
                <span>{m.name}</span>
                <span className="text-xs text-gray-400">
                  {m.provider === 'local' ? (
                    <span className="rounded bg-green-700 px-1.5 py-0.5 text-xs text-green-200">
                      local
                    </span>
                  ) : (
                    m.provider
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
