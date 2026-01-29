"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

function UploadIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 16V4M12 4L8 8M12 4L16 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FileDropzone({ files, onFilesChange, disabled }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Close expanded view when clicking outside
  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesChange([...files, ...droppedFiles]);
    },
    [files, onFilesChange, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
      onFilesChange([...files, ...selectedFiles]);
      e.target.value = "";
    },
    [files, onFilesChange, disabled]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      onFilesChange(newFiles);
    },
    [files, onFilesChange]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Files
      </label>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "dropzone-vault relative p-6 cursor-pointer",
          isDragging && "dragging",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center text-center">
          <div
            className="w-10 h-10 mb-3 border flex items-center justify-center transition-all duration-200"
            style={{
              borderColor: isDragging ? 'var(--primary)' : 'var(--border)',
              transform: isDragging ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            <UploadIcon
              className="w-5 h-5 transition-colors"
              style={{ color: isDragging ? 'var(--primary)' : 'var(--muted-foreground)' }}
            />
          </div>
          <p className="text-sm font-medium">
            {isDragging ? "Drop here" : "Drop files"}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            or click to browse
          </p>
        </div>
      </div>

      {/* Fixed height file display area */}
      <div className="h-4" ref={listRef}>
        {files.length > 0 && (
          <div className="relative">
            {/* Collapsed: show file info */}
            <button
              type="button"
              onClick={() => files.length > 1 && setIsExpanded(!isExpanded)}
              className={cn(
                "text-xs flex items-center gap-1.5 w-full text-left",
                files.length > 1 && "cursor-pointer hover:opacity-70"
              )}
              style={{ color: 'var(--muted-foreground)' }}
            >
              <FileIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{files[0].name}</span>
              {files.length > 1 && (
                <span style={{ color: 'var(--primary)' }}>+{files.length - 1} more</span>
              )}
              <span className="mono ml-auto shrink-0">({formatSize(totalSize)})</span>
              {files.length === 1 && (
                <span
                  onClick={(e) => { e.stopPropagation(); removeFile(0); }}
                  className="ml-1 hover:opacity-70 cursor-pointer"
                  style={{ color: 'var(--destructive)' }}
                >
                  <CloseIcon className="w-3 h-3" />
                </span>
              )}
            </button>

            {/* Expanded view: full list as dropdown overlay */}
            {isExpanded && files.length > 1 && (
              <div
                className="absolute left-0 right-0 top-full mt-1 z-10 border shadow-lg max-h-[200px] overflow-y-auto"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between px-3 py-2 group hover:bg-[var(--secondary)] transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                        <span className="truncate text-sm">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs mono" style={{ color: 'var(--muted-foreground)' }}>
                          {formatSize(file.size)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                            if (files.length <= 2) setIsExpanded(false);
                          }}
                          disabled={disabled}
                          className="p-0.5 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                          style={{ color: 'var(--destructive)' }}
                        >
                          <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
