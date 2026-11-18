import React, { useState } from 'react';
import { MessageSquarePlus, X, Send, Tag, Sparkles } from 'lucide-react';

export interface ComponentAnnotation {
  id: string;
  tagName: string;
  classes: string;
  selector: string;
  textSnippet: string;
  outerHtml: string;
  userNote: string;
  timestamp: number;
}

interface AnnotationPopoverProps {
  position: { top: number; left: number };
  elementData: {
    tagName: string;
    classes: string;
    selector: string;
    textSnippet: string;
    outerHtml: string;
  };
  onAttach: (annotation: ComponentAnnotation) => void;
  onClose: () => void;
}

export default function AnnotationPopover({
  position,
  elementData,
  onAttach,
  onClose,
}: AnnotationPopoverProps) {
  const [note, setNote] = useState('');

  const handleAdd = () => {
    if (!note.trim()) return;
    const annotation: ComponentAnnotation = {
      id: 'ann_' + Date.now(),
      ...elementData,
      userNote: note.trim(),
      timestamp: Date.now(),
    };
    onAttach(annotation);
    onClose();
  };

  return (
    <div
      className="annotation-floating-popover"
      style={{
        position: 'fixed',
        top: Math.max(70, position.top),
        left: Math.max(20, Math.min(position.left, window.innerWidth - 340)),
        zIndex: 99999,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="popover-header">
        <div className="popover-tag-badge">
          <Tag size={12} />
          <span>&lt;{elementData.tagName.toLowerCase()}&gt;</span>
          {elementData.classes && (
            <span className="popover-class-chip">
              .{elementData.classes.split(' ').slice(0, 2).join('.')}
            </span>
          )}
        </div>
        <button className="popover-close-btn" onClick={onClose} title="Dismiss">
          <X size={14} />
        </button>
      </div>

      {elementData.textSnippet && (
        <div className="popover-snippet">
          &quot;{elementData.textSnippet.slice(0, 60)}&quot;
        </div>
      )}

      <div className="popover-body">
        <textarea
          className="popover-textarea"
          rows={3}
          placeholder="E.g. Change font size, make background emerald gradient, add rounded corners..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleAdd();
            }
          }}
          autoFocus
        />
      </div>

      <div className="popover-footer">
        <span className="popover-hint">Ctrl+Enter to attach</span>
        <button
          className="popover-attach-btn"
          onClick={handleAdd}
          disabled={!note.trim()}
        >
          <Sparkles size={13} />
          <span>Attach to Chat</span>
        </button>
      </div>
    </div>
  );
}
