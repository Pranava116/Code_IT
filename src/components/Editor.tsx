"use client";

import Editor, { useMonaco } from "@monaco-editor/react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";

interface EditorProps {
  documentId: string;
  userName: string;
}

export default function CollaborativeEditor({ documentId, userName }: EditorProps) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const editorRef = useRef<any>(null);
  const bindingRef = useRef<any>(null);

  useEffect(() => {
    const doc = new Y.Doc();
    setYdoc(doc);
    
    const newProvider = new HocuspocusProvider({
      url: "ws://127.0.0.1:1234",
      name: documentId,
      document: doc,
      token: userName,
    });

    // We can set awareness local state right away
    const color = `#${Math.floor(Math.random() * 16777215).toString(16).padEnd(6, '0')}`;
    newProvider.awareness?.setLocalStateField('user', {
      name: userName,
      color: color,
    });

    setProvider(newProvider);

    return () => {
      newProvider.destroy();
      doc.destroy();
    };
  }, [documentId, userName]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    if (ydoc && provider) {
      const type = ydoc.getText("monaco");
      bindingRef.current = new MonacoBinding(type, editor.getModel(), new Set([editor]), provider.awareness!);
    }
  };

  useEffect(() => {
    if (editorRef.current && ydoc && provider && !bindingRef.current) {
      const type = ydoc.getText("monaco");
      bindingRef.current = new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness!);
    }
    
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    }
  }, [ydoc, provider]);

  if (!provider) {
    return <div style={{ padding: "2rem" }}>Connecting to collaborative server...</div>;
  }

  return (
    <div style={{ height: "600px", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
      <Editor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          padding: { top: 16 }
        }}
        onMount={handleEditorDidMount}
      />
      
      {/* y-monaco injects specific CSS classes for cursor decorations, we add basic styling for them */}
      <style>{`
        .yRemoteSelection {
          background-color: rgb(250, 129, 0, 0.5);
        }
        .yRemoteSelectionHead {
          position: absolute;
          border-left: 2px solid orange;
          height: 100%;
        }
        .yRemoteSelectionHead::after {
          content: ' ';
          position: absolute;
          border-top: 10px solid orange;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          top: -10px;
          left: -6px;
        }
      `}</style>
    </div>
  );
}
