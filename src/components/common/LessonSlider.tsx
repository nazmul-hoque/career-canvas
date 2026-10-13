import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LessonSlide {
  /** Shown in the caption: "Lesson 2 of 3 · Python". */
  language: string;
  /** Prefix of the files in public/landing: `editor-${name}-light.jpg`, `lesson-${name}-dark.jpg`… */
  name: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

/**
 * Real editor captures, one per slide, behind arrows and dots. It never moves on its own:
 * a visitor reading a test list shouldn't have it slide out from under them.
 */
export function LessonSlider({ slides }: { slides: LessonSlide[] }) {
  const [current, setCurrent] = useState(0);
  const count = slides.length;
  const active = slides[current];
  const goTo = (i: number) => setCurrent(Math.max(0, Math.min(count - 1, i)));

  return (
    <section aria-roledescription="carousel" aria-label="Lessons after a wrong first try">
      <p className="mb-2 text-center text-xs text-chalk" aria-live="polite">
        Lesson {current + 1} of {count}
        {active ? ` · ${active.language}` : null}
      </p>
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
        <SlideArrow
          direction="previous"
          disabled={current === 0}
          onClick={() => goTo(current - 1)}
        />
        <div className="overflow-hidden">
          <div
            className="flex items-start transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((slide, i) => (
              <figure
                key={slide.name}
                role="group"
                aria-roledescription="slide"
                aria-label={`Lesson ${i + 1} of ${count}: ${slide.language}`}
                aria-hidden={i !== current}
                // Off-screen slides keep their links out of the tab order.
                inert={i !== current}
                className="m-0 w-full shrink-0"
              >
                <SlideImage slide={slide} theme="light" lazy={i > 0} />
                <SlideImage slide={slide} theme="dark" lazy={i > 0} />
                <figcaption className="mt-2 text-xs text-chalk">{slide.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <SlideArrow
          direction="next"
          disabled={current === count - 1}
          onClick={() => goTo(current + 1)}
        />
      </div>
      <div className="mt-3 flex justify-center" role="group" aria-label="Choose a lesson">
        {slides.map((slide, i) => (
          <button
            key={slide.name}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show lesson ${i + 1}: ${slide.language}`}
            aria-current={i === current}
            className="grid size-6 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span
              className={cn(
                "size-2 rounded-full border border-chalk",
                i === current && "border-brand bg-brand",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

function SlideImage({
  slide,
  theme,
  lazy,
}: {
  slide: LessonSlide;
  theme: "light" | "dark";
  lazy: boolean;
}) {
  return (
    <a
      href={`/landing/lesson-${slide.name}-${theme}.jpg`}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "overflow-hidden rounded-xl border border-border shadow-lift",
        theme === "light" ? "block dark:hidden" : "hidden dark:block",
      )}
    >
      <img
        src={`/landing/editor-${slide.name}-${theme}.jpg`}
        width={slide.width}
        height={slide.height}
        alt={slide.alt}
        // The first slide is the hero image, so it must not wait.
        loading={lazy ? "lazy" : "eager"}
        className="block h-auto w-full"
      />
    </a>
  );
}

function SlideArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "previous" ? "Previous lesson" : "Next lesson"}
      className="grid size-10 place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon className="size-5" />
    </button>
  );
}
