import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDeveloperInspectorStore } from '@workspace/studio-core';
import { getBoxModel, getInspectableElementAtPoint, getFiberInfoFromDOMNode, BoxModel } from './InspectorEngine';

/**
 * InspectorOverlayRenderer
 * Full-screen, high-precision SVG/HTML overlay for Livex Developer Inspector.
 * Rendered with zero overhead when isEnabled is false.
 */
export const InspectorOverlayRenderer: React.FC = () => {
  const isEnabled = useDeveloperInspectorStore((s) => s.isEnabled);
  const isLiveSelecting = useDeveloperInspectorStore((s) => s.isLiveSelecting);
  const isFrozen = useDeveloperInspectorStore((s) => s.isFrozen);
  const selectedElement = useDeveloperInspectorStore((s) => s.selectedElement);
  const hoveredElement = useDeveloperInspectorStore((s) => s.hoveredElement);
  const gridOverlay = useDeveloperInspectorStore((s) => s.gridOverlay);
  const showBoxModel = useDeveloperInspectorStore((s) => s.showBoxModel);
  const showParentOutline = useDeveloperInspectorStore((s) => s.showParentOutline);
  const showChildrenOutline = useDeveloperInspectorStore((s) => s.showChildrenOutline);
  const measurePair = useDeveloperInspectorStore((s) => s.measurePair);

  const setSelectedElement = useDeveloperInspectorStore((s) => s.setSelectedElement);
  const setHoveredElement = useDeveloperInspectorStore((s) => s.setHoveredElement);
  const setIsLiveSelecting = useDeveloperInspectorStore((s) => s.setIsLiveSelecting);

  const [selectedBox, setSelectedBox] = useState<BoxModel | null>(null);
  const [hoveredBox, setHoveredBox] = useState<BoxModel | null>(null);
  const [parentBox, setParentBox] = useState<BoxModel | null>(null);
  const [childrenBoxes, setChildrenBoxes] = useState<BoxModel[]>([]);
  const [touchTargetWarnings, setTouchTargetWarnings] = useState<DOMRect[]>([]);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Return null immediately when disabled for ZERO runtime overhead
  if (!isEnabled) return null;

  // 1. Update Box Model measurements when selected or hovered element changes
  useEffect(() => {
    if (isFrozen) return;

    if (selectedElement && document.body.contains(selectedElement)) {
      setSelectedBox(getBoxModel(selectedElement));

      if (showParentOutline && selectedElement.parentElement) {
        setParentBox(getBoxModel(selectedElement.parentElement));
      } else {
        setParentBox(null);
      }

      if (showChildrenOutline && selectedElement.children.length > 0) {
        const boxes: BoxModel[] = [];
        for (let i = 0; i < Math.min(selectedElement.children.length, 12); i++) {
          const child = selectedElement.children[i] as HTMLElement;
          if (child) boxes.push(getBoxModel(child));
        }
        setChildrenBoxes(boxes);
      } else {
        setChildrenBoxes([]);
      }
    } else {
      setSelectedBox(null);
      setParentBox(null);
      setChildrenBoxes([]);
    }

    if (hoveredElement && document.body.contains(hoveredElement)) {
      setHoveredBox(getBoxModel(hoveredElement));
    } else {
      setHoveredBox(null);
    }
  }, [selectedElement, hoveredElement, isFrozen, showParentOutline, showChildrenOutline]);

  // 2. Global Capturing Pointer/Touch Listener for Live Selection & Long Press
  useEffect(() => {
    if (!isEnabled || isFrozen) return;

    const handlePointerMove = (e: PointerEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as PointerEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as PointerEvent).clientY;

      if (clientX === undefined || clientY === undefined) return;

      if (isLiveSelecting) {
        const target = getInspectableElementAtPoint(clientX, clientY);
        if (target && target !== hoveredElement) {
          setHoveredElement(target);
          setSelectedElement(target, getFiberInfoFromDOMNode(target));
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

      longPressTimerRef.current = setTimeout(() => {
        const target = getInspectableElementAtPoint(touch.clientX, touch.clientY);
        if (target) {
          setSelectedElement(target, getFiberInfoFromDOMNode(target));
        }
      }, 500);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartPosRef.current || !longPressTimerRef.current) return;
      const touch = e.touches[0];
      const dist = Math.hypot(touch.clientX - touchStartPosRef.current.x, touch.clientY - touchStartPosRef.current.y);
      if (dist > 10) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { capture: true, passive: true });
    window.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: true });
    window.addEventListener('touchend', handleTouchEnd, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove, { capture: true });
      window.removeEventListener('touchstart', handleTouchStart, { capture: true });
      window.removeEventListener('touchmove', handleTouchMove, { capture: true });
      window.removeEventListener('touchend', handleTouchEnd, { capture: true });
    };
  }, [isEnabled, isLiveSelecting, isFrozen, hoveredElement, setHoveredElement, setSelectedElement]);

  // 3. Touch target validator calculation (minimum 48x48dp check)
  useEffect(() => {
    if (gridOverlay !== 'touchTargets') {
      setTouchTargetWarnings([]);
      return;
    }
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
    const warnings: DOMRect[] = [];
    interactiveElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        warnings.push(rect);
      }
    });
    setTouchTargetWarnings(warnings);
  }, [gridOverlay]);

  return (
    <div
      data-inspector-overlay="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 999999,
        overflow: 'hidden',
      }}
    >
      {/* 1. Grid Overlays */}
      {gridOverlay === '4dp' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 1px, transparent 1px)',
            backgroundSize: '4px 4px',
          }}
        />
      )}
      {gridOverlay === '8dp' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 1.5px, transparent 1.5px)',
            backgroundSize: '8px 8px',
          }}
        />
      )}
      {gridOverlay === 'safeArea' && (
        <div
          style={{
            position: 'absolute',
            top: 'env(safe-area-inset-top, 0px)',
            left: 'env(safe-area-inset-left, 0px)',
            right: 'env(safe-area-inset-right, 0px)',
            bottom: 'env(safe-area-inset-bottom, 0px)',
            border: '2px dashed #f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
          }}
        />
      )}

      {/* Touch Target Warnings (red outlines for small targets < 44dp) */}
      {touchTargetWarnings.map((rect, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            border: '2px dashed #ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
          }}
        />
      ))}

      {/* 2. Parent Outline (Secondary accent) */}
      {parentBox && (
        <div
          style={{
            position: 'absolute',
            left: `${parentBox.rect.left}px`,
            top: `${parentBox.rect.top}px`,
            width: `${parentBox.rect.width}px`,
            height: `${parentBox.rect.height}px`,
            border: '1.5px dashed rgba(168, 85, 247, 0.7)',
            borderRadius: parentBox.borderRadius,
          }}
        />
      )}

      {/* 3. Children Outlines (Third accent) */}
      {childrenBoxes.map((child, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: `${child.rect.left}px`,
            top: `${child.rect.top}px`,
            width: `${child.rect.width}px`,
            height: `${child.rect.height}px`,
            border: '1px dotted rgba(6, 182, 212, 0.6)',
            borderRadius: child.borderRadius,
          }}
        />
      ))}

      {/* 4. Hovered Element Highlight */}
      {hoveredBox && (
        <div
          style={{
            position: 'absolute',
            left: `${hoveredBox.rect.left}px`,
            top: `${hoveredBox.rect.top}px`,
            width: `${hoveredBox.rect.width}px`,
            height: `${hoveredBox.rect.height}px`,
            border: '2px solid #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            borderRadius: hoveredBox.borderRadius,
            transition: 'all 80ms ease-out',
          }}
        />
      )}

      {/* 5. Selected Element Box Model & Outline */}
      {selectedBox && (
        <>
          {/* Main Selected Outline */}
          <div
            style={{
              position: 'absolute',
              left: `${selectedBox.rect.left}px`,
              top: `${selectedBox.rect.top}px`,
              width: `${selectedBox.rect.width}px`,
              height: `${selectedBox.rect.height}px`,
              border: '2.5px solid #10b981',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.5), inset 0 0 8px rgba(16, 185, 129, 0.2)',
              borderRadius: selectedBox.borderRadius,
              transition: 'all 100ms ease-out',
            }}
          />

          {/* DevTools Box Model Shading */}
          {showBoxModel && (
            <>
              {/* Margin Area (Amber) */}
              <div
                style={{
                  position: 'absolute',
                  left: `${selectedBox.rect.left - selectedBox.margin.left}px`,
                  top: `${selectedBox.rect.top - selectedBox.margin.top}px`,
                  width: `${selectedBox.rect.width + selectedBox.margin.left + selectedBox.margin.right}px`,
                  height: `${selectedBox.rect.height + selectedBox.margin.top + selectedBox.margin.bottom}px`,
                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                  border: '1px dashed rgba(245, 158, 11, 0.5)',
                  pointerEvents: 'none',
                }}
              />
              {/* Padding Area (Emerald) */}
              <div
                style={{
                  position: 'absolute',
                  left: `${selectedBox.content.x - selectedBox.padding.left}px`,
                  top: `${selectedBox.content.y - selectedBox.padding.top}px`,
                  width: `${selectedBox.content.width + selectedBox.padding.left + selectedBox.padding.right}px`,
                  height: `${selectedBox.content.height + selectedBox.padding.top + selectedBox.padding.bottom}px`,
                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                  pointerEvents: 'none',
                }}
              />
              {/* Content Area (Blue) */}
              <div
                style={{
                  position: 'absolute',
                  left: `${selectedBox.content.x}px`,
                  top: `${selectedBox.content.y}px`,
                  width: `${selectedBox.content.width}px`,
                  height: `${selectedBox.content.height}px`,
                  backgroundColor: 'rgba(59, 130, 246, 0.25)',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}

          {/* Selected Element Floating Dimension Badge */}
          <div
            style={{
              position: 'absolute',
              left: `${selectedBox.rect.left}px`,
              top: `${Math.max(8, selectedBox.rect.top - 24)}px`,
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'monospace',
              padding: '2px 8px',
              borderRadius: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {Math.round(selectedBox.rect.width)} × {Math.round(selectedBox.rect.height)} px
          </div>
        </>
      )}

      {/* 6. Measurement Line & Distance Tool (Between 2 elements) */}
      {measurePair[0] && measurePair[1] && (
        <MeasurementLine el1={measurePair[0]} el2={measurePair[1]} />
      )}
    </div>
  );
};

/**
 * Render measurement lines and distance badge between two selected DOM elements
 */
const MeasurementLine: React.FC<{ el1: HTMLElement; el2: HTMLElement }> = ({ el1, el2 }) => {
  const rect1 = el1.getBoundingClientRect();
  const rect2 = el2.getBoundingClientRect();

  const c1 = { x: rect1.left + rect1.width / 2, y: rect1.top + rect1.height / 2 };
  const c2 = { x: rect2.left + rect2.width / 2, y: rect2.top + rect2.height / 2 };

  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const dist = Math.round(Math.hypot(dx, dy));

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <line
        x1={c1.x}
        y1={c1.y}
        x2={c2.x}
        y2={c2.y}
        stroke="#ec4899"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <circle cx={c1.x} cy={c1.y} r="4" fill="#ec4899" />
      <circle cx={c2.x} cy={c2.y} r="4" fill="#ec4899" />
      <rect
        x={(c1.x + c2.x) / 2 - 24}
        y={(c1.y + c2.y) / 2 - 12}
        width="48"
        height="24"
        rx="4"
        fill="#ec4899"
      />
      <text
        x={(c1.x + c2.x) / 2}
        y={(c1.y + c2.y) / 2 + 4}
        fill="#ffffff"
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="monospace"
      >
        {dist}px
      </text>
    </svg>
  );
};
