"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EventCard } from "@/components/calendar/EventCard";
import { WeekNavigator } from "@/components/calendar/WeekNavigator";
import {
  addWeeks,
  formatWeekRange,
  getEventWeekRange,
  getEventsForWeek,
  getWeekStart,
  getWeekStartsInRange,
  toDateString,
} from "@/lib/events";
import { getResponseKey } from "@/lib/mock-data";

const WEEKS_TO_EXTEND = 4;
const FUTURE_PADDING_WEEKS = 4;

/**
 * Default range starts at the focused week (usually current week).
 * Past weeks are not included until the user navigates backward.
 */
function getInitialWeekRange(events, focusedWeekStart) {
  const focused = getWeekStart(focusedWeekStart);
  const { last } = getEventWeekRange(events);

  let end = addWeeks(focused, FUTURE_PADDING_WEEKS);
  if (last.getTime() > end.getTime()) {
    end = addWeeks(getWeekStart(last), FUTURE_PADDING_WEEKS);
  }

  return { start: focused, end: getWeekStart(end) };
}

export function WeekView({
  events,
  weekStart,
  onWeekChange,
  currentPlayerId,
  responses,
  onAvailabilityChange,
  availabilityDisabled = false,
}) {
  const [weekRange, setWeekRange] = useState(() =>
    getInitialWeekRange(events, weekStart)
  );
  const [visibleWeekStart, setVisibleWeekStart] = useState(() =>
    getWeekStart(weekStart)
  );
  const weekSectionRefs = useRef(new Map());
  const loadMoreSentinelRef = useRef(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const hasInitialScrollRef = useRef(false);
  const prevFocusedKeyRef = useRef(null);

  const weekStarts = useMemo(
    () => getWeekStartsInRange(weekRange.start, weekRange.end),
    [weekRange]
  );

  const visibleWeekKey = toDateString(visibleWeekStart);
  const focusedWeekKey = toDateString(getWeekStart(weekStart));

  const extendWeekRange = useCallback((targetWeekStart) => {
    const normalized = getWeekStart(targetWeekStart);

    setWeekRange((previous) => {
      let start = previous.start;
      let end = previous.end;

      if (normalized.getTime() < start.getTime()) {
        start = normalized;
      }

      if (normalized.getTime() > end.getTime()) {
        end = normalized;
      }

      if (
        start.getTime() === previous.start.getTime() &&
        end.getTime() === previous.end.getTime()
      ) {
        return previous;
      }

      return { start, end };
    });

    return normalized;
  }, []);

  const scrollToWeek = useCallback((targetWeekStart, { smooth = true } = {}) => {
    const key = toDateString(getWeekStart(targetWeekStart));
    const section = weekSectionRefs.current.get(key);

    if (!section) {
      return false;
    }

    isProgrammaticScroll.current = true;

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    section.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "start",
    });
    scrollTimeoutRef.current = window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, smooth ? 600 : 50);

    return true;
  }, []);

  const handleNavigatorWeekChange = useCallback(
    (nextWeekStart) => {
      const normalized = extendWeekRange(nextWeekStart);
      setVisibleWeekStart(normalized);
      onWeekChange(normalized);
      // Allow past weeks when navigating back
      scrollToWeek(normalized, { smooth: true });
    },
    [extendWeekRange, onWeekChange, scrollToWeek]
  );

  // Keep future range in sync with events, but never pull start before focused week
  // unless the user already navigated earlier (previous.start < focused).
  useEffect(() => {
    const focused = getWeekStart(weekStart);
    const next = getInitialWeekRange(events, focused);

    setWeekRange((previous) => {
      const userWentBack = previous.start.getTime() < focused.getTime();
      const start = userWentBack ? previous.start : focused;
      const end =
        next.end.getTime() > previous.end.getTime() ? next.end : previous.end;

      if (
        start.getTime() === previous.start.getTime() &&
        end.getTime() === previous.end.getTime()
      ) {
        return previous;
      }

      return { start, end };
    });
  }, [events, weekStart]);

  useEffect(() => {
    const normalized = getWeekStart(weekStart);
    setVisibleWeekStart(normalized);
    extendWeekRange(normalized);

    const isFirstScroll = !hasInitialScrollRef.current;
    const focusedChanged = prevFocusedKeyRef.current !== focusedWeekKey;
    prevFocusedKeyRef.current = focusedWeekKey;

    if (!focusedChanged && hasInitialScrollRef.current) {
      return;
    }

    // Wait a frame so week sections exist in the DOM
    const frame = window.requestAnimationFrame(() => {
      const didScroll = scrollToWeek(normalized, {
        smooth: !isFirstScroll,
      });
      if (didScroll) {
        hasInitialScrollRef.current = true;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [focusedWeekKey, extendWeekRange, scrollToWeek, weekStart]);

  useEffect(() => {
    const headers = weekStarts
      .map((start) => {
        const key = toDateString(start);
        const section = weekSectionRefs.current.get(key);
        return section?.querySelector("[data-week-header]") ?? null;
      })
      .filter(Boolean);

    if (headers.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) {
          return;
        }

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              left.boundingClientRect.top - right.boundingClientRect.top
          );

        const topEntry = visible[0];
        if (!topEntry) {
          return;
        }

        const nextKey = topEntry.target.dataset.weekKey;
        if (nextKey && nextKey !== visibleWeekKey) {
          setVisibleWeekStart(getWeekStart(new Date(`${nextKey}T12:00:00`)));
        }
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: [0, 1] }
    );

    headers.forEach((header) => observer.observe(header));

    return () => observer.disconnect();
  }, [visibleWeekKey, weekStarts]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        setWeekRange((previous) => ({
          start: previous.start,
          end: addWeeks(previous.end, WEEKS_TO_EXTEND),
        }));
      },
      { rootMargin: "200px 0px 200px 0px", threshold: 0 }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [weekStarts.length]);

  useEffect(
    () => () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    },
    []
  );

  return (
    <section className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 border-b bg-muted/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
        <WeekNavigator
          weekStart={visibleWeekStart}
          onWeekChange={handleNavigatorWeekChange}
        />
      </div>

      <div className="space-y-10">
        {weekStarts.map((start) => {
          const weekKey = toDateString(start);
          const weekEvents = getEventsForWeek(events, start);

          return (
            <section
              key={weekKey}
              ref={(element) => {
                if (element) {
                  weekSectionRefs.current.set(weekKey, element);
                } else {
                  weekSectionRefs.current.delete(weekKey);
                }
              }}
              className="scroll-mt-28 space-y-4"
            >
              <h3
                data-week-header
                data-week-key={weekKey}
                className="text-base font-semibold text-foreground"
              >
                Week {formatWeekRange(start)}
              </h3>

              {weekEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Geen events deze week
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {weekEvents.map((event) => {
                    const responseKey = getResponseKey(currentPlayerId, event.id);

                    return (
                      <EventCard
                        key={event.id}
                        event={event}
                        value={responses[responseKey] ?? null}
                        onChange={(status) =>
                          onAvailabilityChange(event.id, status)
                        }
                        availabilityDisabled={availabilityDisabled}
                        responses={responses}
                        currentPlayerId={currentPlayerId}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div ref={loadMoreSentinelRef} className="h-px" aria-hidden="true" />
    </section>
  );
}
