import { useRef, useState } from 'react';
import { Upload, X, Image } from 'lucide-react';

export default function FileUpload({ onFileSelect, onFileRemove, multiple = false, accept = 'image/*', maxFiles = 5, preview = true, className = '' }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (newFiles) => {
    const arr = Array.from(newFiles).slice(0, multiple ? maxFiles - files.length : 1);
    const withPreviews = arr.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    const updated = multiple ? [...files, ...withPreviews].slice(0, maxFiles) : withPreviews;
    setFiles(updated);
    onFileSelect?.(multiple ? updated.map((f) => f.file) : updated[0]?.file);
  };

  const remove = (i) => {
    const updated = files.filter((_, idx) => idx !== i);
    setFiles(updated);
    onFileRemove?.(i);
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-hub-accent bg-hub-accent/5' : 'border-hub-border hover:border-hub-accent/50 hover:bg-hub-surface2'}`}
      >
        <Upload className="mx-auto mb-2 text-hub-muted" size={24} />
        <p className="text-sm text-hub-muted font-body">Drop files here or <span className="text-hub-accent">click to upload</span></p>
        {multiple && <p className="text-xs text-hub-muted mt-1">Max {maxFiles} files</p>}
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
      {preview && files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {files.map((f, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-hub-surface2">
              <img src={f.url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
              <button onClick={(e) => { e.stopPropagation(); remove(i); }}
                className="absolute top-1 right-1 p-0.5 bg-black/70 rounded-full text-white hover:bg-red-500/80 transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
