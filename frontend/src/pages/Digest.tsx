import { useState, useEffect } from "react";
import { fetchDigest } from "@/services/api";
import { FileText, Download, Copy, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DigestPage() {
  const [format, setFormat] = useState<"html" | "markdown">("html");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setTimeout(() => { if (active) setLoading(true); }, 0);
    fetchDigest(format)
      .then(setContent)
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [format]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === "html" ? "html" : "md";
    const mime = format === "html" ? "text/html" : "text/markdown";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `animal-legislation-digest.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="h-6 w-6 text-accent" />
            <span className="gradient-text">Weekly Digest</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Generated report of all tracked animal-related legislation
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Format Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["html", "markdown"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={cn(
                  "px-4 py-2 text-xs font-medium transition-all capitalize",
                  format === f
                    ? "bg-accent text-white"
                    : "bg-surface text-text-muted hover:text-text"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Actions */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted hover:text-text hover:border-border-light transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-pro" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-xs font-semibold text-white hover:shadow-lg hover:shadow-accent/25 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : content ? (
        <div className="glass rounded-2xl overflow-hidden">
          {format === "html" ? (
            <iframe
              srcDoc={content}
              className="w-full min-h-[80vh] border-0 rounded-2xl"
              title="Digest Preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <pre className="p-6 text-sm text-text-muted leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-[80vh]">
              {content}
            </pre>
          )}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No digest available</h2>
          <p className="text-text-muted">Run the pipeline first to generate bill data for the digest.</p>
        </div>
      )}
    </div>
  );
}
