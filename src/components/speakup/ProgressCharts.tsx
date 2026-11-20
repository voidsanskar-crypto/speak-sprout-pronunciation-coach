import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartData = { weekly: { day: string; phrases: number; avg: number | null }[] };

export function WeeklyActivity({ weekly }: ChartData) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={weekly} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{ borderRadius: 16, border: "1px solid var(--border)" }}
        />
        <Bar dataKey="phrases" name="Phrases" fill="var(--primary)" radius={[10, 10, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScoreTrend({ weekly }: ChartData) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={weekly} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid var(--border)" }} />
        <Line
          type="monotone"
          dataKey="avg"
          name="Avg score"
          stroke="var(--accent)"
          strokeWidth={3.5}
          dot={{ r: 4, fill: "var(--accent)" }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
