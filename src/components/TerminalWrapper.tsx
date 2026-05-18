"use client";

import dynamic from "next/dynamic";

const TerminalView = dynamic(() => import("./TerminalView"), { ssr: false });

export default function TerminalWrapper({ projectId }: { projectId: string }) {
  return <TerminalView projectId={projectId} />;
}
