"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface ChartData {
  chart_type: "trend" | "bar" | "pie"
  title: string
  x?: (string | number)[]
  y?: (string | number)[]
  labels?: (string | number)[]
  values?: (string | number)[]
}

interface BotChartProps {
  data: ChartData
  className?: string
}

// Colors for pie chart segments
const PIE_COLORS = [
  "#f59e0b", // yellow-500
  "#ef4444", // red-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#f97316", // orange-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
]

export default function BotChart({ data, className = "" }: BotChartProps) {
  const getChartData = () => {
    try {
      if (data.chart_type === "pie") {
        if (!data.labels || !data.values) {
          return []
        }
        return data.labels.map((label, index) => ({
          name: String(label),
          value: Number(data.values![index]) || 0,
        }))
      } else {
        // For trend and bar charts
        if (!data.x || !data.y) {
          return []
        }
        if (data.x.length !== data.y.length) {
          return []
        }
        return data.x.map((xValue, index) => ({
          name: String(xValue),
          value: Number(data.y![index]) || 0,
        }))
      }
    } catch (error) {
      return []
    }
  }

  const chartData = getChartData()

  if (!data) {
    return (
      <Card className={`w-full max-w-4xl mx-auto mt-6 mb-4 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <p>No chart data provided</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data.chart_type) {
    return (
      <Card className={`w-full max-w-4xl mx-auto mt-6 mb-4 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <p>Invalid chart data: missing chart_type</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderChart = () => {
    switch (data.chart_type) {
      case "trend":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={90} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`₹${value}`, "Sales"]} labelFormatter={(label) => `Date: ${label}`} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#f59e0b", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={90} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`₹${value}`, "Sales"]} labelFormatter={(label) => `Category: ${label}`} />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (Number(percent) * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <p>Unsupported chart type: {data.chart_type}</p>
          </div>
        )
    }
  }

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800 text-center mx-[16px] my-[8px]">{data.title || "Chart"}</CardTitle>
        <CardDescription className="text-sm text-gray-600 text-center mx-[16px] my-[8px]">
          {data.chart_type === "trend" && "Sales trend over time"}
          {data.chart_type === "bar" && "Sales comparison by category"}
          {data.chart_type === "pie" && "Sales distribution breakdown"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center pt-6">
        {chartData.length > 0 ? (
          <div className="w-full">
            {renderChart()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <p>No data available to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
