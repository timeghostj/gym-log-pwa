"use client";

import type { ExerciseProgressSet } from "../../workout-cloud";
type Props = {
  sets: ExerciseProgressSet[];
};

export default function ProgressChart({ sets }: Props) {
  const byDate = new Map<string, number>();

  for (const set of sets) {
    const previous = byDate.get(set.workoutDate) ?? 0;
    byDate.set(set.workoutDate, Math.max(previous, set.weight));
  }

  const points = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, weight]) => ({ date, weight }));

  if (points.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Complete a workout to start tracking your progress.
      </p>
    );
  }

  const width = 340;
  const height = 180;
  const left = 38;
  const right = 12;
  const top = 18;
  const bottom = 35;

  const maxWeight = Math.max(...points.map((point) => point.weight), 1);
  const chartMax = Math.ceil(maxWeight / 5) * 5 + 5;

  const x = (index: number) =>
    points.length === 1
      ? (left + width - right) / 2
      : left + (index / (points.length - 1)) * (width - left - right);

  const y = (weight: number) =>
    height - bottom -
    (weight / chartMax) * (height - top - bottom);

  const line = points
    .map((point, index) => `${x(index)},${y(point.weight)}`)
    .join(" ");

  return (
    <div className="rounded-lg bg-gray-800 p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Heaviest weight per completed workout"
      >
        {[0, 0.5, 1].map((fraction) => {
          const weight = chartMax * fraction;
          const posY = y(weight);

          return (
            <g key={fraction}>
              <line
                x1={left}
                y1={posY}
                x2={width - right}
                y2={posY}
                stroke="#4b5563"
                strokeDasharray="4 4"
              />
              <text
                x={left - 7}
                y={posY + 4}
                fill="#9ca3af"
                fontSize="10"
                textAnchor="end"
              >
                {weight}
              </text>
            </g>
          );
        })}

        {points.length > 1 && (
          <polyline
            points={line}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((point, index) => (
          <g key={point.date}>
            <circle
              cx={x(index)}
              cy={y(point.weight)}
              r="5"
              fill="#10b981"
            >
              <title>
                {point.date}: {point.weight} lb
              </title>
            </circle>

            {(points.length <= 5 ||
              index === 0 ||
              index === points.length - 1) && (
              <text
                x={x(index)}
                y={height - 10}
                fill="#9ca3af"
                fontSize="10"
                textAnchor="middle"
              >
                {new Date(`${point.date}T12:00:00`).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                )}
              </text>
            )}
          </g>
        ))}
      </svg>

      <p className="mt-2 text-center text-xs text-gray-400">
        Heaviest weight per workout (lb)
      </p>
    </div>
  );
}