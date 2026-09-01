'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Markdown({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_a]:break-words [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:break-all [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black/30 [&_pre]:p-3 [&_pre]:text-[13px] [&_pre]:whitespace-pre-wrap [&_pre]:max-w-full [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-white/10 [&_th]:p-2 [&_td]:border [&_td]:border-white/10 [&_td]:p-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
