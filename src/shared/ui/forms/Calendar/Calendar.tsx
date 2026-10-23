"use client";
import { Box, Link, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { addDays, brasiliaToday, nightsBetween } from "@/shared/lib/date/stayRules";
import { quintalColors } from "@/shared/theme/tokens/colors";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { calendarCopy } from "./calendarCopy";
import {
  addMonths,
  buildMonth,
  dayLabel,
  monthOf,
  monthsBetween,
  monthTitle,
  pickInRange,
  rangeSummary,
  shiftMonths,
  weekdayOf,
  type CalendarMonth,
  type RangeValue,
} from "./calendarDates";

interface CalendarBase {
  /** Primeiro dia escolhível (como chegada, num intervalo). */
  min?: string;
  /** Último dia escolhível (como chegada, num intervalo). */
  max?: string;
  /** Hoje, `yyyy-MM-dd`; sem ele, hoje em Brasília. */
  today?: string;
  /** Meses lado a lado: 2 para intervalo no desktop. */
  months?: 1 | 2;
  /** Dias que não podem ser escolhidos, além dos limites. */
  isDisabled?: (iso: string) => boolean;
  /** Mostra o link "Limpar" quando há data escolhida. */
  onClear?: () => void;
  /** Leva o foco ao dia ativo ao montar (calendário aberto num popover). */
  autoFocus?: boolean;
}
interface SingleProps extends CalendarBase {
  mode: "single";
  value: string;
  onChange: (iso: string) => void;
}
interface RangeProps extends CalendarBase {
  mode: "range";
  value: RangeValue;
  /** `complete` é verdadeiro quando o toque escolheu a saída. */
  onChange: (range: RangeValue, complete: boolean) => void;
  /** Noites máximas entre chegada e saída; dias além ficam apagados, com o limite explicado no rodapé. */
  maxNights?: number;
  /** Qual data o campo que abriu o calendário está editando. */
  editing?: "start" | "end";
}
export type CalendarProps = SingleProps | RangeProps;

const slide = keyframes({ from: { opacity: 0, transform: "translateX(8px)" }, to: { opacity: 1, transform: "none" } });
const CELL = 44;
const PILL = `${quintalRadii.pill}px`;
const WEEK = "repeat(7, 1fr)";

function Chevron({ direction, double = false }: { direction: "left" | "right"; double?: boolean }) {
  const paths =
    direction === "left"
      ? double
        ? ["M11 6l-6 6 6 6", "M18 6l-6 6 6 6"]
        : ["M15 6l-6 6 6 6"]
      : double
        ? ["M6 6l6 6-6 6", "M13 6l6 6-6 6"]
        : ["M9 6l6 6-6 6"];
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

interface NavButtonProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

function NavButton({ label, disabled, onClick, children }: NavButtonProps) {
  return (
    <Box
      component="button"
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      sx={{
        width: 40,
        height: 40,
        flex: "none",
        display: "grid",
        placeItems: "center",
        p: 0,
        cursor: "pointer",
        color: "text.primary",
        bgcolor: "background.paper",
        border: "2px solid",
        borderColor: "text.primary",
        borderRadius: PILL,
        "&:hover:not(:disabled)": { bgcolor: quintalColors.luz },
        "&:disabled": { opacity: 0.35, cursor: "default" },
        "&:focus-visible": { outline: `3px solid ${quintalColors.tinta}`, outlineOffset: 2 },
      }}
    >
      {children}
    </Box>
  );
}

/**
 * Calendário de datas do PetHost: um mês (ou dois) com escolha de dia ou de intervalo, no padrão de grade de datas do
 * WAI-ARIA (setas, Home/End, PageUp/PageDown, Enter/Espaço). Datas são ISO `yyyy-MM-dd`, sem fuso. Dias fora dos
 * limites ficam apagados e não respondem ao toque; o limite de noites é explicado no rodapé. Num intervalo, `min` e
 * `max` valem para a chegada e a saída só obedece a `maxNights`.
 *
 * @example <Calendar mode="range" value={{ start, end }} onChange={setRange} months={2} maxNights={30} min={today} />
 */
export function Calendar(props: CalendarProps) {
  const { min, max, months = 1, isDisabled, onClear, autoFocus = false } = props;
  const today = props.today ?? brasiliaToday();
  const range: RangeValue = props.mode === "range" ? props.value : { start: props.value, end: "" };
  const maxNights = props.mode === "range" ? props.maxNights : undefined;
  const editingEnd = props.mode === "range" && props.editing === "end";
  const awaitingEnd = props.mode === "range" && Boolean(range.start) && (!range.end || editingEnd);

  const farthestEnd = awaitingEnd && maxNights !== undefined ? addDays(range.start, maxNights) : undefined;
  const upper = max !== undefined && farthestEnd !== undefined && farthestEnd > max ? farthestEnd : max;
  const clampDay = (iso: string) => (min && iso < min ? min : upper && iso > upper ? upper : iso);

  const base = clampDay(range.start || today);
  const [focusIso, setFocusIso] = useState(base);
  const [view, setView] = useState<CalendarMonth>(monthOf(base));
  const [navigated, setNavigated] = useState(false);
  const [choosingYear, setChoosingYear] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(autoFocus);

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    root.current?.querySelector<HTMLElement>(`[data-iso="${focusIso}"]`)?.focus();
  }, [focusIso, view]);

  function isBlocked(iso: string): boolean {
    if (isDisabled?.(iso)) return true;
    if (awaitingEnd && iso > range.start) return maxNights !== undefined && nightsBetween(range.start, iso) > maxNights;
    return (min !== undefined && iso < min) || (max !== undefined && iso > max);
  }

  function showDay(iso: string) {
    const month = monthOf(iso);
    pendingFocus.current = true;
    setFocusIso(iso);
    const offset = monthsBetween(view, month);
    if (offset < 0) setView(month);
    else if (offset > months - 1) setView(addMonths(month, 1 - months));
    if (offset < 0 || offset > months - 1) setNavigated(true);
  }

  function choose(iso: string) {
    if (isBlocked(iso)) return;
    setFocusIso(iso);
    if (props.mode === "single") props.onChange(iso);
    else {
      const { range: next, complete } = pickInRange(range, iso, editingEnd);
      props.onChange(next, complete);
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const weekday = weekdayOf(focusIso);
    let next: string;
    if (event.key in step) next = addDays(focusIso, step[event.key]!);
    else if (event.key === "Home") next = addDays(focusIso, -weekday);
    else if (event.key === "End") next = addDays(focusIso, 6 - weekday);
    else if (event.key === "PageUp") next = shiftMonths(focusIso, event.shiftKey ? -12 : -1);
    else if (event.key === "PageDown") next = shiftMonths(focusIso, event.shiftKey ? 12 : 1);
    else return;
    event.preventDefault();
    showDay(clampDay(next));
  }

  const limitView = (candidate: CalendarMonth) => {
    let result = candidate;
    if (upper && monthsBetween(result, monthOf(upper)) < months - 1) result = addMonths(monthOf(upper), 1 - months);
    if (min && monthsBetween(monthOf(min), result) < 0) result = monthOf(min);
    return result;
  };
  function moveView(delta: number) {
    const next = limitView(addMonths(view, delta));
    const applied = monthsBetween(view, next);
    if (!applied) return;
    pendingFocus.current = false;
    setView(next);
    setFocusIso(clampDay(shiftMonths(focusIso, applied)));
    setNavigated(true);
  }
  function chooseYear(year: number) {
    const next = limitView({ year, month: view.month });
    const applied = monthsBetween(view, next);
    pendingFocus.current = false;
    setView(next);
    if (applied) setFocusIso(clampDay(shiftMonths(focusIso, applied)));
    setChoosingYear(false);
    setNavigated(true);
  }
  const canMove = (delta: number) => monthsBetween(view, limitView(addMonths(view, delta))) !== 0;
  const yearJump = !min || !upper || monthsBetween(monthOf(min), monthOf(upper)) > 24;

  const visible = Array.from({ length: months }, (_, index) => addMonths(view, index));
  const tabIso = visible.some((month) => monthsBetween(month, monthOf(focusIso)) === 0) ? focusIso : undefined;

  const summary = props.mode === "range" && Boolean(range.start && range.end) && !editingEnd;
  let hint: string = calendarCopy.pickStart;
  if (props.mode === "single") hint = range.start ? dayLabel(range.start) : calendarCopy.pickDay;
  else if (summary) hint = rangeSummary(range.start, range.end);
  else if (awaitingEnd)
    hint = farthestEnd === undefined ? calendarCopy.pickEnd : calendarCopy.pickEndLimited(maxNights!, farthestEnd);

  return (
    <Stack ref={root} spacing={1.5} onKeyDown={onKeyDown} sx={{ p: { xs: 1.5, sm: 2 }, color: "text.primary" }}>
      {choosingYear ? (
        <YearGrid
          current={view.year}
          minYear={min ? monthOf(min).year : undefined}
          maxYear={upper ? monthOf(upper).year : undefined}
          onPick={chooseYear}
        />
      ) : (
        <Stack direction="row" spacing={{ xs: 0, sm: 3 }} sx={{ alignItems: "flex-start" }}>
          {visible.map((month, index) => (
            <Box key={index} sx={{ flex: 1, minWidth: 0, width: { sm: months === 2 ? 308 : "auto" } }}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 0.5, mb: 1 }}>
                {index === 0 ? (
                  <Stack direction="row" spacing={0.5}>
                    {yearJump && (
                      <NavButton
                        label={calendarCopy.previousYear}
                        disabled={!canMove(-12)}
                        onClick={() => moveView(-12)}
                      >
                        <Chevron direction="left" double />
                      </NavButton>
                    )}
                    <NavButton label={calendarCopy.previousMonth} disabled={!canMove(-1)} onClick={() => moveView(-1)}>
                      <Chevron direction="left" />
                    </NavButton>
                  </Stack>
                ) : (
                  <Box sx={{ width: 40 }} />
                )}
                <Typography
                  component="h3"
                  aria-live="polite"
                  sx={{
                    fontFamily: "var(--font-display, 'Caprasimo'), serif",
                    fontSize: "1.25rem",
                    textAlign: "center",
                  }}
                >
                  {yearJump && index === 0 ? (
                    <Box
                      component="button"
                      type="button"
                      aria-expanded={false}
                      aria-label={`${monthTitle(month)}, ${calendarCopy.chooseYear}`}
                      onClick={() => setChoosingYear(true)}
                      sx={{
                        font: "inherit",
                        color: "inherit",
                        bgcolor: "transparent",
                        border: 0,
                        p: 0.5,
                        cursor: "pointer",
                        textDecoration: "underline",
                        textDecorationStyle: "dashed",
                        textUnderlineOffset: "4px",
                        borderRadius: `${quintalRadii.control}px`,
                        "&:focus-visible": { outline: `3px solid ${quintalColors.tinta}`, outlineOffset: 2 },
                      }}
                    >
                      {monthTitle(month)}
                    </Box>
                  ) : (
                    monthTitle(month)
                  )}
                </Typography>
                {index === visible.length - 1 ? (
                  <Stack direction="row" spacing={0.5}>
                    <NavButton label={calendarCopy.nextMonth} disabled={!canMove(1)} onClick={() => moveView(1)}>
                      <Chevron direction="right" />
                    </NavButton>
                    {yearJump && (
                      <NavButton label={calendarCopy.nextYear} disabled={!canMove(12)} onClick={() => moveView(12)}>
                        <Chevron direction="right" double />
                      </NavButton>
                    )}
                  </Stack>
                ) : (
                  <Box sx={{ width: 40 }} />
                )}
              </Stack>
              <Box
                key={`${month.year}-${month.month}`}
                role="grid"
                aria-label={monthTitle(month)}
                sx={{ animation: navigated ? `${slide} 160ms ease-out` : undefined }}
              >
                <Box role="row" sx={{ display: "grid", gridTemplateColumns: WEEK, mb: 0.5 }}>
                  {calendarCopy.weekdays.map(([letter, full], column) => (
                    <Box
                      key={column}
                      role="columnheader"
                      aria-label={full}
                      sx={{
                        textAlign: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        color: "text.secondary",
                      }}
                    >
                      {letter}
                    </Box>
                  ))}
                </Box>
                {buildMonth(month).map((week, row) => (
                  <Box key={row} role="row" sx={{ display: "grid", gridTemplateColumns: WEEK }}>
                    {week.map((iso, column) =>
                      iso ? (
                        <DayCell
                          key={iso}
                          iso={iso}
                          column={column}
                          range={range}
                          rangeMode={props.mode === "range"}
                          today={today}
                          blocked={isBlocked(iso)}
                          tabbable={iso === tabIso}
                          onChoose={choose}
                          onFocusDay={setFocusIso}
                        />
                      ) : (
                        <Box key={column} role="gridcell" aria-hidden sx={{ height: CELL }} />
                      ),
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      )}
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          borderTop: "2px dashed",
          borderColor: "divider",
          pt: 1.5,
        }}
      >
        <Typography
          aria-live="polite"
          sx={{
            fontSize: "0.95rem",
            fontWeight: summary ? 700 : 400,
            color: summary ? "text.primary" : "text.secondary",
          }}
        >
          {hint}
        </Typography>
        {onClear && range.start && (
          <Link component="button" type="button" onClick={onClear} sx={{ flex: "none", fontSize: "0.95rem" }}>
            {calendarCopy.clear}
          </Link>
        )}
      </Stack>
    </Stack>
  );
}

interface DayCellProps {
  iso: string;
  column: number;
  range: RangeValue;
  rangeMode: boolean;
  today: string;
  blocked: boolean;
  tabbable: boolean;
  onChoose: (iso: string) => void;
  onFocusDay: (iso: string) => void;
}

function DayCell({ iso, column, range, rangeMode, today, blocked, tabbable, onChoose, onFocusDay }: DayCellProps) {
  const complete = rangeMode && Boolean(range.start && range.end);
  const isStart = iso === range.start;
  const isEnd = rangeMode && iso === range.end;
  const inside = complete && iso > range.start && iso < range.end;
  const selected = isStart || isEnd;
  const role = rangeMode && isStart ? calendarCopy.start : isEnd ? calendarCopy.end : null;
  const label = [dayLabel(iso), role, iso === today ? calendarCopy.today : null].filter(Boolean).join(", ");
  const strip = quintalColors.grama;
  const background = inside
    ? strip
    : complete && isStart
      ? `linear-gradient(to right, transparent 50%, ${strip} 50%)`
      : complete && isEnd
        ? `linear-gradient(to left, transparent 50%, ${strip} 50%)`
        : undefined;
  const edge =
    inside && column === 0 ? `${PILL} 0 0 ${PILL}` : inside && column === 6 ? `0 ${PILL} ${PILL} 0` : undefined;
  return (
    <Box
      role="gridcell"
      aria-selected={selected || inside}
      sx={{ height: CELL, display: "grid", placeItems: "center", background, borderRadius: edge }}
    >
      <Box
        component="button"
        type="button"
        data-iso={iso}
        aria-label={label}
        aria-disabled={blocked || undefined}
        aria-current={iso === today ? "date" : undefined}
        tabIndex={tabbable ? 0 : -1}
        onClick={() => onChoose(iso)}
        onFocus={() => onFocusDay(iso)}
        sx={{
          width: CELL - 4,
          height: CELL - 4,
          p: 0,
          font: "inherit",
          fontWeight: selected ? 700 : 400,
          color: blocked ? "text.secondary" : "text.primary",
          opacity: blocked ? 0.45 : 1,
          cursor: blocked ? "not-allowed" : "pointer",
          borderRadius: PILL,
          border: "2px solid",
          borderColor: selected ? "text.primary" : "transparent",
          bgcolor: selected ? quintalColors.coral : "transparent",
          ...(iso === today && !selected && { borderStyle: "dashed", borderColor: "text.primary" }),
          "&:hover": !blocked && !selected ? { bgcolor: quintalColors.luz } : undefined,
          "&:focus-visible": { outline: `3px solid ${quintalColors.tinta}`, outlineOffset: 2 },
        }}
      >
        {Number(iso.slice(8))}
      </Box>
    </Box>
  );
}

interface YearGridProps {
  current: number;
  minYear?: number;
  maxYear?: number;
  onPick: (year: number) => void;
}
const YEARS_PER_PAGE = 24;

/** Os anos em páginas de 24 (a última termina no ano máximo): data de anos atrás sem dezenas de cliques. */
function YearGrid({ current, minYear, maxYear, onPick }: YearGridProps) {
  const first = maxYear !== undefined ? maxYear - YEARS_PER_PAGE + 1 : (minYear ?? current - 15);
  const [start, setStart] = useState(current < first ? current - 11 : first);
  const canPage = (delta: number) => {
    const next = start + delta * YEARS_PER_PAGE;
    return (
      (minYear === undefined || next + YEARS_PER_PAGE - 1 >= minYear) && (maxYear === undefined || next <= maxYear)
    );
  };
  return (
    <Box sx={{ minWidth: { sm: 308 } }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <NavButton
          label={calendarCopy.previousYears}
          disabled={!canPage(-1)}
          onClick={() => setStart(start - YEARS_PER_PAGE)}
        >
          <Chevron direction="left" double />
        </NavButton>
        <Typography component="h3" sx={{ fontFamily: "var(--font-display, 'Caprasimo'), serif", fontSize: "1.25rem" }}>
          {calendarCopy.chooseYear}
        </Typography>
        <NavButton
          label={calendarCopy.nextYears}
          disabled={!canPage(1)}
          onClick={() => setStart(start + YEARS_PER_PAGE)}
        >
          <Chevron direction="right" double />
        </NavButton>
      </Stack>
      <Box
        role="group"
        aria-label={calendarCopy.chooseYear}
        sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.5 }}
      >
        {Array.from({ length: YEARS_PER_PAGE }, (_, index) => start + index).map((year) => {
          const blocked = (minYear !== undefined && year < minYear) || (maxYear !== undefined && year > maxYear);
          return (
            <Box
              key={year}
              component="button"
              type="button"
              disabled={blocked}
              aria-pressed={year === current}
              onClick={() => onPick(year)}
              sx={{
                height: CELL - 4,
                font: "inherit",
                fontWeight: year === current ? 700 : 400,
                color: "text.primary",
                cursor: "pointer",
                borderRadius: PILL,
                border: "2px solid",
                borderColor: year === current ? "text.primary" : "transparent",
                bgcolor: year === current ? quintalColors.coral : "transparent",
                "&:hover:not(:disabled)": year === current ? undefined : { bgcolor: quintalColors.luz },
                "&:disabled": { opacity: 0.35, cursor: "default" },
                "&:focus-visible": { outline: `3px solid ${quintalColors.tinta}`, outlineOffset: 2 },
              }}
            >
              {year}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
