"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MapPlanZeigerProps {
  /** Called when position changes (center of crosshair in container coordinates) */
  onPositionChange: (position: { x: number; y: number }) => void;
  /** Whether the crosshair can be dragged */
  draggable?: boolean;
  /** Size of the planzeiger in pixels */
  size?: number;
  /** Additional class name */
  className?: string;
  /** Show hint text on first interaction */
  showHint?: boolean;
}

/**
 * MapPlanZeiger - Draggable crosshair overlay with 100m grid
 *
 * This component renders a fixed-size crosshair overlay that can be dragged
 * to select a position on the map. It includes a 10x10 subdivision grid
 * representing 100m squares (when the map is at the correct zoom level).
 *
 * The crosshair is always centered in the container - dragging moves the
 * underlying map instead of moving the crosshair itself.
 */
export function MapPlanZeiger({
  onPositionChange,
  draggable = true,
  size = 160,
  className,
  showHint = true,
}: MapPlanZeigerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Report center position on mount and resize
  useEffect(() => {
    const reportCenter = () => {
      const container = containerRef.current?.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        onPositionChange({ x: rect.width / 2, y: rect.height / 2 });
      }
    };

    reportCenter();
    window.addEventListener("resize", reportCenter);
    return () => window.removeEventListener("resize", reportCenter);
  }, [onPositionChange]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setHasInteracted(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    },
    [draggable],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!draggable) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setHasInteracted(true);
      const touch = e.touches[0];
      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    },
    [draggable],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const container = containerRef.current?.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      // Update drag start for continuous dragging
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      // Report the delta movement (will be used to pan the map)
      onPositionChange({
        x: rect.width / 2 - deltaX,
        y: rect.height / 2 - deltaY,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragStartRef.current) return;

      const container = containerRef.current?.parentElement;
      if (!container) return;

      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;

      dragStartRef.current = { x: touch.clientX, y: touch.clientY };

      onPositionChange({
        x: rect.width / 2 - deltaX,
        y: rect.height / 2 - deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, onPositionChange]);

  const gridLines = 10; // 10x10 grid = 100m squares at 1km
  const cellSize = size / gridLines;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 pointer-events-none flex items-center justify-center z-10",
        className,
      )}
    >
      {/* Hint text */}
      {showHint && !hasInteracted && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-pulse">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-muted-foreground shadow-lg">
            Verschiebe die Karte zur Position
          </div>
        </div>
      )}

      {/* Crosshair container */}
      <div
        className={cn(
          "relative pointer-events-auto cursor-grab select-none",
          isDragging && "cursor-grabbing",
          draggable && "touch-none",
        )}
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={cn(
            "transition-transform duration-150",
            isDragging && "planzeiger-glow scale-105",
          )}
        >
          {/* Background with slight transparency for contrast */}
          <rect
            x={0}
            y={0}
            width={size}
            height={size}
            fill="rgba(0, 0, 0, 0.15)"
            rx={4}
          />

          {/* 100m grid lines (10x10 subdivision) */}
          {Array.from({ length: gridLines - 1 }, (_, i) => i + 1).map((i) => (
            <g key={i}>
              {/* Vertical line */}
              <line
                x1={i * cellSize}
                y1={0}
                x2={i * cellSize}
                y2={size}
                stroke="var(--utm-cyan)"
                strokeWidth={0.5}
                opacity={0.3}
              />
              {/* Horizontal line */}
              <line
                x1={0}
                y1={i * cellSize}
                x2={size}
                y2={i * cellSize}
                stroke="var(--utm-cyan)"
                strokeWidth={0.5}
                opacity={0.3}
              />
            </g>
          ))}

          {/* Outer border */}
          <rect
            x={1}
            y={1}
            width={size - 2}
            height={size - 2}
            fill="none"
            stroke="var(--utm-cyan)"
            strokeWidth={2}
            rx={4}
          />

          {/* Center crosshair - horizontal line */}
          <line
            x1={0}
            y1={size / 2}
            x2={size / 2 - 12}
            y2={size / 2}
            stroke="var(--utm-cyan)"
            strokeWidth={2}
          />
          <line
            x1={size / 2 + 12}
            y1={size / 2}
            x2={size}
            y2={size / 2}
            stroke="var(--utm-cyan)"
            strokeWidth={2}
          />

          {/* Center crosshair - vertical line */}
          <line
            x1={size / 2}
            y1={0}
            x2={size / 2}
            y2={size / 2 - 12}
            stroke="var(--utm-cyan)"
            strokeWidth={2}
          />
          <line
            x1={size / 2}
            y1={size / 2 + 12}
            x2={size / 2}
            y2={size}
            stroke="var(--utm-cyan)"
            strokeWidth={2}
          />

          {/* Center point - outer ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={8}
            fill="none"
            stroke="var(--drk-red)"
            strokeWidth={2}
          />

          {/* Center point - inner dot */}
          <circle cx={size / 2} cy={size / 2} r={4} fill="var(--drk-red)" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Static crosshair marker for showing positions on reveal maps
 */
export function CrosshairMarkerIcon({
  color = "destructive",
  size = 32,
  className,
}: {
  color?: "correct" | "destructive" | "secondary";
  size?: number;
  className?: string;
}) {
  const colorMap = {
    correct: "var(--correct)",
    destructive: "var(--drk-red)",
    secondary: "var(--utm-cyan)",
  };

  const strokeColor = colorMap[color];

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
      {/* Outer circle */}
      <circle
        cx={16}
        cy={16}
        r={12}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
      />
      {/* Crosshair lines */}
      <line
        x1={16}
        y1={4}
        x2={16}
        y2={10}
        stroke={strokeColor}
        strokeWidth={2}
      />
      <line
        x1={16}
        y1={22}
        x2={16}
        y2={28}
        stroke={strokeColor}
        strokeWidth={2}
      />
      <line
        x1={4}
        y1={16}
        x2={10}
        y2={16}
        stroke={strokeColor}
        strokeWidth={2}
      />
      <line
        x1={22}
        y1={16}
        x2={28}
        y2={16}
        stroke={strokeColor}
        strokeWidth={2}
      />
      {/* Center dot */}
      <circle cx={16} cy={16} r={3} fill={strokeColor} />
    </svg>
  );
}
