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
const PADDING_WEEKS = 2;

function getInitialWeekRange(events, focusedWeekStart) {
  const { first, last } = getEventWeekRange(events);
  let start = addWeeks(first, -PADDING_WEEKS);
  let end = addWeeks(last, PADDING_WEEKS);
  const focused = getWeekStart(focusedWeekStart);

  if (focused.getTime() < start.getTime()) {
    start = focused;
  }

  if (focused.getTime() > end.getTime()) {
    end = focused;
  }

  return { start: getWeekStart(start), end: getWeekStart(end) };
}

export function WeekView({
  events,
  weekStart,
  onWeekChange,
  currentPlayerId,
  responses,
  onAvailabilityChange,
  availabilityDisabled = false,
  lineups,
  onLineupViewed,
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

  const scrollToWeek = useCallback((targetWeekStart) => {
    const key = toDateString(getWeekStart(targetWeekStart));
    const section = weekSectionRefs.current.get(key);

    if (!section) {
      return;
    }

    isProgrammaticScroll.current = true;

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
    scrollTimeoutRef.current = window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 600);
  }, []);

  const handleNavigatorWeekChange = useCallback(
    (nextWeekStart) => {
      const normalized = extendWeekRange(nextWeekStart);
      setVisibleWeekStart(normalized);
      onWeekChange(normalized);
      scrollToWeek(normalized);
    },
    [extendWeekRange, onWeekChange, scrollToWeek]
  );

  useEffect(() => {
    setWeekRange((previous) => {
      const next = getInitialWeekRange(events, weekStart);
      const start =
        next.start.getTime() < previous.start.getTime()
          ? next.start
          : previous.start;
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
    scrollToWeek(normalized);
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
                        lineups={lineups}
                        onLineupViewed={onLineupViewed}
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
