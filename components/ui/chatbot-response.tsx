"use client"

import { Card, CardContent } from "@/components/ui/card"
import BotChart from "@/components/ui/bot-chart"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatbotResponseData {
  answer: string
  chart: string
  img_json: {
    chart_type: "trend" | "bar" | "pie"
    title: string
    x?: (string | number)[]
    y?: (string | number)[]
    labels?: (string | number)[]
    values?: (string | number)[]
  }
}

interface ChatbotResponseProps {
  data: ChatbotResponseData
  className?: string
}

export default function ChatbotResponse({ data, className = "" }: ChatbotResponseProps) {
  const shouldShowChart = Boolean(data.img_json)

  const hasValidChartData =
    shouldShowChart &&
    data.img_json.chart_type &&
    ((data.img_json.chart_type === "pie" && data.img_json.labels && data.img_json.values) ||
      (["trend", "bar"].includes(data.img_json.chart_type) && data.img_json.x && data.img_json.y))

  // Check if answer contains markdown syntax
  const hasMarkdown = /[#*_`\[\]]/.test(data.answer) || data.answer.includes('\n\n')

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Text Response */}
      <Card>
        <CardContent className="pt-6">
          <div className="prose prose-sm max-w-none">
            {hasMarkdown ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-gray-700" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mt-3 mb-2 text-gray-700" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-2 mb-1 text-gray-700" {...props} />,
                  p: ({ node, ...props }) => <p className="leading-relaxed mb-2 text-gray-700" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-700" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-700" {...props} />,
                  li: ({ node, ...props }) => <li className="ml-4 text-gray-700" {...props} />,
                  code: ({ node, inline, ...props }: any) => {
                    if (inline) {
                      return <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-700" {...props} />
                    }
                    return <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto text-gray-700" {...props} />
                  },
                  pre: ({ node, ...props }) => <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-2" {...props} />,
                  a: ({ node, ...props }: any) => (
                    <a className="text-[#005F73] hover:text-[#C2410C] underline" target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-600" {...props} />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-2">
                      <table className="min-w-full border-collapse border border-gray-300" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
                  th: ({ node, ...props }) => (
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-gray-300 px-3 py-2 text-gray-700" {...props} />
                  ),
                  hr: ({ node, ...props }) => <hr className="my-4 border-gray-300" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-semibold text-gray-700" {...props} />,
                  em: ({ node, ...props }) => <em className="italic text-gray-700" {...props} />,
                }}
              >
                {data.answer}
              </ReactMarkdown>
            ) : (
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{data.answer}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chart Response - only show if chart is not "none" */}
      {shouldShowChart && hasValidChartData && <BotChart data={data.img_json} />}
    </div>
  )
}
