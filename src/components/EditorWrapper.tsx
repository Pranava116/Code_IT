"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("./Editor"), { ssr: false });

export default function EditorWrapper(props: { documentId: string; userName: string }) {
  return <Editor {...props} />;
}
