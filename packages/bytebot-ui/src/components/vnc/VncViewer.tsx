"use client";

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import VncScreen with SSR disabled
const VncScreen = dynamic(
  () => import("react-vnc").then((mod) => mod.VncScreen),
  { ssr: false }
);

interface VncViewerProps {
  viewOnly?: boolean;
}

export function VncViewer({ viewOnly = true }: VncViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${window.location.host}/api/proxy/websockify`;
    console.log("VNC WebSocket URL:", url);
    setWsUrl(url);
  }, []);

  if (!isClient || !wsUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <div className="text-sm text-muted-foreground">Initializing desktop viewer...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full bg-black">
      {connectionStatus === "connecting" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/80">
          <div className="text-sm text-foreground">Connecting to desktop...</div>
        </div>
      )}
      <VncScreen
        rfbOptions={{
          shared: true,
        }}
        key={viewOnly ? "view-only" : "interactive"}
        url={wsUrl}
        scaleViewport
        viewOnly={viewOnly}
        style={{ width: "100%", height: "100%" }}
        onConnect={() => {
          console.log("VNC Connected");
          setConnectionStatus("connected");
        }}
        onDisconnect={() => {
          console.log("VNC Disconnected");
          setConnectionStatus("disconnected");
        }}
      />
      {connectionStatus === "disconnected" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/80">
          <div className="text-sm text-destructive">Desktop connection lost</div>
        </div>
      )}
    </div>
  );
}
