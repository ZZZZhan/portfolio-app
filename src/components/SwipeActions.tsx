"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

/** 左滑露出的单个操作 */
export interface SwipeAction {
  key: string;
  label: string;
  icon?: ReactNode;
  /** 按钮底色，直接写 CSS 值，如 var(--color-red) */
  bg: string;
  onSelect: () => void;
}

/** 单个操作按钮宽度 */
const ACTION_WIDTH = 62;
/** 松手时拖过操作区这个比例就吸附到展开，否则回弹 */
const SNAP_RATIO = 0.35;
/** 位移超过这个值才锁定手势主方向（横向接管 / 纵向让页面滚） */
const AXIS_LOCK = 8;

/**
 * 左滑露出操作按钮的行容器（受控）。
 *
 * open / onOpenChange 交给外部维护，列表里同一时刻只展开一行。
 * 纵向滑动会交还给页面滚动，不抢手势。
 */
export default function SwipeActions({
  actions,
  open,
  onOpenChange,
  className = "",
  children,
}: {
  actions: SwipeAction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  children: ReactNode;
}) {
  const maxOffset = actions.length * ACTION_WIDTH;

  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  // 一次手势的起点、起始位移；axis 一旦锁定就不再改判
  const gesture = useRef<{
    x: number;
    y: number;
    from: number;
    axis: "none" | "x" | "y";
  } | null>(null);
  // 横向拖动后紧跟的那次 click 要吞掉，否则会误触内容里的链接
  const swallowClick = useRef(false);

  // 拖拽中跟手，松手后由 open 决定终态（带过渡动画）
  const offset = dragging ? dragOffset : open ? maxOffset : 0;

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    swallowClick.current = false;
    gesture.current = {
      x: e.clientX,
      y: e.clientY,
      from: open ? maxOffset : 0,
      axis: "none",
    };
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.axis === "y") return;

    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;

    if (g.axis === "none") {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (g.axis === "y") return; // 纵向为主：本次手势整个交还给页面滚动
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
    }

    // 左滑时 dx 为负 → 位移变大；两端夹住不越界
    setDragOffset(Math.min(maxOffset, Math.max(0, g.from - dx)));
  }

  function handlePointerEnd(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.axis !== "x") return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    swallowClick.current = true;
    setDragging(false);
    onOpenChange(dragOffset > maxOffset * SNAP_RATIO);
  }

  return (
    // shrink-0 不能省：本组件常作为 flex 列表的子项，而 overflow-hidden 会让
    // flex item 的自动最小尺寸从 min-content 退化成 0，行会被列表等比压扁。
    <div
      className={`relative shrink-0 overflow-hidden rounded-[14px] shadow-card ${className}`}
    >
      {/*
       * 滑动层：内容与操作区在同一个 flex 行里并排，整体左移露出操作区。
       * 不用「操作区 absolute + 内容盖在上面」——那样内容因 transform 被提升为独立合成层，
       * 与主层里的操作区各自栅格化，行高为小数时会在边缘漏出 1px 色边。
       */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClickCapture={(e) => {
          if (!swallowClick.current) return;
          swallowClick.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{
          transform: `translate3d(${-offset}px, 0, 0)`,
          transition: dragging
            ? "none"
            : "transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)",
          touchAction: "pan-y", // 纵向交给浏览器滚动，横向留给手势
        }}
        className="flex select-none"
      >
        {/* 内容：占满整行宽度，操作区被挤到右侧容器外，由 overflow-hidden 裁掉 */}
        <div className="relative w-full shrink-0">
          {children}
          {/* 展开时点内容先收起，不触发内容里的跳转 */}
          {open && (
            <button
              type="button"
              aria-label="收起操作"
              onClick={() => onOpenChange(false)}
              className="absolute inset-0"
            />
          )}
        </div>

        {/*
         * 操作区：色块由普通 div 承载并 self-stretch，高度与内容严格一致。
         * 不让 <button> 直接铺背景——button 作为 flex item 的拉伸受 UA 默认样式影响，
         * 容易比同行内容高/矮 1px，在边缘漏出色边。
         */}
        <div className="flex shrink-0 self-stretch" style={{ width: maxOffset }}>
          {actions.map((a) => (
            <div
              key={a.key}
              className="flex shrink-0 self-stretch"
              style={{ width: ACTION_WIDTH, backgroundColor: a.bg }}
            >
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                aria-hidden={!open}
                onClick={() => {
                  onOpenChange(false);
                  a.onSelect();
                }}
                className="w-full self-stretch flex flex-col items-center justify-center gap-1 text-white active:brightness-90"
              >
                {a.icon}
                <span className="text-[11px] font-medium leading-none">{a.label}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
