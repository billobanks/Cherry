import type { MyPatternsData } from "@/lib/my-patterns";
import { CycleDayProfileChart } from "./cycle-day-profile-chart";
import { CycleLengthChart } from "./cycle-length-chart";
import { FrequencyBarChart } from "./frequency-bar-chart";
import { InsightSentenceCard } from "./insight-sentence-card";
import { PatternEmptyState } from "./pattern-empty-state";
import { PeriodDurationChart } from "./period-duration-chart";
import { SectionCard } from "./section-card";

export function MyPatternsView({ data }: { data: MyPatternsData }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          My Patterns
        </span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">
          What your logs say about you
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground text-pretty">
          Built from what you&apos;ve actually logged. Every observation shows how many cycles or
          entries support it, and nothing here is a diagnosis.
        </p>
      </div>

      {!data.hasAnyData ? (
        <PatternEmptyState message="Keep logging your check-ins and periods — patterns need at least two or three cycles of data before they mean anything, so nothing shows here yet." />
      ) : null}

      <SectionCard
        title="Cycle length"
        description={
          data.cycleLength
            ? `Your average cycle over the last ${Math.round(data.cycleLength.cycleCount)} logged cycles is ${data.cycleLength.averageDays} days.`
            : undefined
        }
      >
        {data.cycleLength ? (
          <CycleLengthChart trend={data.cycleLength} />
        ) : (
          <PatternEmptyState message="Log at least 2 completed cycles to see your cycle length trend." />
        )}
      </SectionCard>

      <SectionCard
        title="Period duration"
        description={
          data.periodDuration
            ? `You've logged an average of ${data.periodDuration.averageDays} days of flow per period, across ${data.periodDuration.cycleCount} cycles.`
            : undefined
        }
      >
        {data.periodDuration ? (
          <PeriodDurationChart trend={data.periodDuration} />
        ) : (
          <PatternEmptyState message="Log flow on at least 2 periods to see your period duration trend." />
        )}
      </SectionCard>

      <SectionCard title="Most common symptoms">
        {data.commonSymptoms.length > 0 ? (
          <div className="flex flex-col gap-4">
            <FrequencyBarChart
              items={data.commonSymptoms.map((s) => ({ label: s.label, count: s.count }))}
              unit="log"
            />
            {data.symptomPhasePatterns.map((p) => (
              <InsightSentenceCard
                key={`${p.key}-${p.phase}`}
                sentence={p.sentence}
                dataPointLabel={`${p.occurrences} of your last ${p.eligibleCycles} cycles`}
              />
            ))}
          </div>
        ) : (
          <PatternEmptyState message="Log symptoms in a few check-ins to see which ones come up most." />
        )}
      </SectionCard>

      <SectionCard title="Mood patterns">
        {data.moodFrequency.length > 0 || data.moodPatterns.length > 0 ? (
          <div className="flex flex-col gap-4">
            {data.moodFrequency.length > 0 ? (
              <FrequencyBarChart
                items={data.moodFrequency.map((m) => ({ label: m.label, count: m.count }))}
                unit="log"
              />
            ) : null}
            {data.moodPatterns.map((p) => (
              <InsightSentenceCard
                key={`${p.key}-${p.phase}`}
                sentence={p.sentence}
                dataPointLabel={`${p.occurrences} of your last ${p.eligibleCycles} cycles`}
              />
            ))}
          </div>
        ) : (
          <PatternEmptyState message="Log your mood in a few check-ins to see your patterns." />
        )}
      </SectionCard>

      <SectionCard
        title="Energy patterns"
        description="Average energy level (1-5) by day of your cycle."
      >
        {data.energy.profile.length > 0 ? (
          <div className="flex flex-col gap-4">
            <CycleDayProfileChart analysis={data.energy} color="primary" unit="/5" />
            {data.energy.patterns.map((p) => (
              <InsightSentenceCard
                key={p.windowLabel}
                sentence={p.sentence}
                dataPointLabel={`${p.cycleCount} cycles`}
              />
            ))}
          </div>
        ) : (
          <PatternEmptyState message="Log energy in your daily check-in to see your energy patterns." />
        )}
      </SectionCard>

      <SectionCard
        title="Sleep patterns"
        description="Average sleep quality (1-5) by day of your cycle."
      >
        {data.sleep.profile.length > 0 ? (
          <div className="flex flex-col gap-4">
            <CycleDayProfileChart analysis={data.sleep} color="secondary" unit="/5" />
            {data.sleep.patterns.map((p) => (
              <InsightSentenceCard
                key={p.windowLabel}
                sentence={p.sentence}
                dataPointLabel={`${p.cycleCount} cycles`}
              />
            ))}
          </div>
        ) : (
          <PatternEmptyState message="Log sleep in your daily check-in to see your sleep patterns." />
        )}
      </SectionCard>

      <SectionCard title="Craving patterns">
        {data.cravingPatterns.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.cravingPatterns.map((p) => (
              <InsightSentenceCard
                key={`${p.key}-${p.phase}`}
                sentence={p.sentence}
                dataPointLabel={`${p.occurrences} of your last ${p.eligibleCycles} cycles`}
              />
            ))}
          </div>
        ) : (
          <PatternEmptyState message="Log cravings as a symptom in a few check-ins to see when they tend to show up." />
        )}
      </SectionCard>

      <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
        These are patterns in what you&apos;ve logged, not medical findings — they never diagnose a
        condition. If something feels off, a licensed healthcare professional is the right person
        to ask.
      </p>
    </div>
  );
}
