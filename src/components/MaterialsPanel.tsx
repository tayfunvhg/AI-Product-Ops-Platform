"use client";

import { useRef, useState } from "react";

type Material = { id: string; title: string; meta: string };

const ACCEPT = ".pdf,.pptx,.md,.markdown,image/*";

/**
 * Раздел «Материалы» — загрузка файлов (видение, презентации, исследования) и
 * кнопка «Проанализировать». Анализ выполнит будущий агент, который предложит
 * изменения в видение/стратегию — пока это задел (агент не подключён).
 */
export default function MaterialsPanel({
  initial,
  title = "Материалы",
}: {
  initial: Material[];
  title?: string;
}) {
  const [materials, setMaterials] = useState<Material[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeNote, setAnalyzeNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const added: Material[] = [];
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", f);
      try {
        const res = await fetch("/api/extract", { method: "POST", body: fd });
        const data = await res.json();
        added.push({
          id: `${f.name}-${added.length}`,
          title: data?.name ?? f.name,
          meta: data?.ok ? "загружено" : "не удалось извлечь текст",
        });
      } catch {
        added.push({ id: `${f.name}-${added.length}`, title: f.name, meta: "ошибка загрузки" });
      }
    }
    setMaterials((m) => [...added, ...m]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function analyze() {
    setAnalyzing(true);
    setAnalyzeNote(null);
    // Stub: the analysis agent is not wired yet.
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzeNote(
        "Агент анализа материалов ещё не подключён. Здесь он изучит материалы и предложит изменения в видение и стратегию."
      );
    }, 600);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">{title}</h2>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-ghost disabled:opacity-50"
          >
            {uploading ? "Загружаю…" : "📎 Загрузить"}
          </button>
          <button
            type="button"
            onClick={analyze}
            disabled={analyzing || materials.length === 0}
            title={materials.length === 0 ? "Сначала загрузите материалы" : "Анализ материалов агентом"}
            className="btn-primary disabled:opacity-50"
          >
            {analyzing ? "Анализирую…" : "Проанализировать"}
          </button>
        </div>
      </div>

      {analyzeNote && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          {analyzeNote}
        </div>
      )}

      {materials.length === 0 ? (
        <p className="text-sm text-white/40">
          Пока нет материалов. Загрузите видение, презентации или исследования.
        </p>
      ) : (
        <div className="card divide-y divide-white/5 p-0">
          {materials.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg">📄</span>
              <span className="min-w-0 flex-1 truncate font-medium text-white" title={p.title}>
                {p.title}
              </span>
              <span className="shrink-0 text-xs text-white/45">{p.meta}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
