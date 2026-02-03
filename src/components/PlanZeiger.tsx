"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PlanZeigerProps {
  /** Current position in screen coordinates */
  position: { x: number; y: number };
  /** Called when position changes */
  onPositionChange: (position: { x: number; y: number }) => void;
  /** Container element for bounds */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Whether the crosshair can be dragged */
  draggable?: boolean;
  /** Size of the crosshair */
  size?: "sm" | "md" | "lg";
  /** Additional class name */
  className?: string;
}

export function PlanZeiger({
  position,
  onPositionChange,
  containerRef,
  draggable = true,
  size = "md",
  className,
}: PlanZeigerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const crosshairRef = useRef<HTMLDivElement>(null);

  const sizeConfig = {
    sm: { size: 40, lineLength: 20, thickness: 2 },
    md: { size: 60, lineLength: 30, thickness: 2 },
    lg: { size: 80, lineLength: 40, thickness: 3 },
  };

  const config = sizeConfig[size];

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable) return;
      e.preventDefault();
      setIsDragging(true);

      // Calculate offset from crosshair center
      const rect = crosshairRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - (rect.left + rect.width / 2),
          y: e.clientY - (rect.top + rect.height / 2),
        });
      }
    },
    [draggable],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!draggable) return;
      e.preventDefault();
      setIsDragging(true);

      const touch = e.touches[0];
      const rect = crosshairRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: touch.clientX - (rect.left + rect.width / 2),
          y: touch.clientY - (rect.top + rect.height / 2),
        });
      }
    },
    [draggable],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(
          containerRect.width,
          e.clientX - containerRect.left - dragOffset.x,
        ),
      );
      const y = Math.max(
        0,
        Math.min(
          containerRect.height,
          e.clientY - containerRect.top - dragOffset.y,
        ),
      );

      onPositionChange({ x, y });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const touch = e.touches[0];
      const containerRect = container.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(
          containerRect.width,
          touch.clientX - containerRect.left - dragOffset.x,
        ),
      );
      const y = Math.max(
        0,
        Math.min(
          containerRect.height,
          touch.clientY - containerRect.top - dragOffset.y,
        ),
      );

      onPositionChange({ x, y });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
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
  }, [isDragging, containerRef, onPositionChange, dragOffset]);

  return (
    <div
      ref={crosshairRef}
      role="img"
      aria-roledescription="Verschiebbares Fadenkreuz"
      aria-label="Ziehe um Position zu wählen"
      className={cn(
        "absolute pointer-events-auto cursor-grab",
        isDragging && "cursor-grabbing",
        draggable && "touch-none",
        className,
      )}
      style={{
        left: position.x - config.size / 2,
        top: position.y - config.size / 2,
        width: config.size,
        height: config.size,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <svg
        width={config.size}
        height={config.size}
        viewBox={`0 0 ${config.size} ${config.size}`}
        aria-hidden="true"
        className={cn(
          "transition-transform",
          isDragging && "planzeiger-glow scale-110",
        )}
      >
        {/* Outer circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={config.size / 2 - config.thickness}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.thickness}
          className="text-secondary"
        />

        {/* Horizontal line */}
        <line
          x1={0}
          y1={config.size / 2}
          x2={config.size / 2 - config.lineLength / 2}
          y2={config.size / 2}
          stroke="currentColor"
          strokeWidth={config.thickness}
          className="text-secondary"
        />
        <line
          x1={config.size / 2 + config.lineLength / 2}
          y1={config.size / 2}
          x2={config.size}
          y2={config.size / 2}
          stroke="currentColor"
          strokeWidth={config.thickness}
          className="text-secondary"
        />

        {/* Vertical line */}
        <line
          x1={config.size / 2}
          y1={0}
          x2={config.size / 2}
          y2={config.size / 2 - config.lineLength / 2}
          stroke="currentColor"
          strokeWidth={config.thickness}
          className="text-secondary"
        />
        <line
          x1={config.size / 2}
          y1={config.size / 2 + config.lineLength / 2}
          x2={config.size / 2}
          y2={config.size}
          stroke="currentColor"
          strokeWidth={config.thickness}
          className="text-secondary"
        />

        {/* Center dot */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={config.thickness + 1}
          fill="currentColor"
          className="text-primary"
        />
      </svg>
    </div>
  );
}

/**
 * Static crosshair for showing correct/guessed positions
 */
export function CrosshairMarker({
  color = "secondary",
  size = "sm",
  className,
}: {
  color?: "secondary" | "primary" | "correct" | "destructive";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeConfig = {
    sm: 24,
    md: 32,
    lg: 48,
  };

  const colorConfig = {
    secondary: "text-secondary",
    primary: "text-primary",
    correct: "text-correct",
    destructive: "text-destructive",
  };

  const s = sizeConfig[size];

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn(colorConfig[color], className)}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="12"
        y1="2"
        x2="12"
        y2="8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="12"
        y1="16"
        x2="12"
        y2="22"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="2"
        y1="12"
        x2="8"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="16"
        y1="12"
        x2="22"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
