import React from 'react'
import {
  Globe,
  BookOpen,
  FileSpreadsheet,
  FileCheck2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'

interface QuickLinkItem {
  title: string
  subtitle: string
  href: string
  icon: typeof Globe
  color: string
  isExternal?: boolean
}

const QUICK_LINKS: QuickLinkItem[] = [
  {
    title: 'School Official Website',
    subtitle: 'Campus announcements & faculty directory',
    href: 'https://roshanipublicschool.com',
    icon: Globe,
    color: 'bg-blue-50 text-blue-600 border-blue-200/70',
    isExternal: true,
  },
  {
    title: 'Online Digital Library',
    subtitle: 'E-books, journals & digital references',
    href: '/erp/student/documents',
    icon: BookOpen,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
  },
  {
    title: 'Study Materials & Syllabus',
    subtitle: 'Chapter notes, assignments & guides',
    href: '/erp/student/documents',
    icon: FileSpreadsheet,
    color: 'bg-purple-50 text-purple-600 border-purple-200/70',
  },
  {
    title: 'Student Code of Conduct',
    subtitle: 'Academic integrity & institutional policies',
    href: '/erp/student/documents',
    icon: FileCheck2,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  },
]

export function StudentQuickLinksCard() {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/70 flex items-center justify-center text-sky-600 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Institutional Links</h3>
              <p className="text-[11px] text-slate-400">Campus Resources &amp; Guides</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
            Resources
          </span>
        </div>

        {/* Links List */}
        <div className="divide-y divide-slate-100 my-2">
          {QUICK_LINKS.map((link, idx) => {
            const Icon = link.icon
            return (
              <a
                key={idx}
                href={link.href}
                target={link.isExternal ? '_blank' : '_self'}
                rel={link.isExternal ? 'noopener noreferrer' : undefined}
                className="py-2.5 flex items-center justify-between gap-3 group hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg ${link.color} border flex items-center justify-center shrink-0`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                      {link.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {link.subtitle}
                    </p>
                  </div>
                </div>
                <div className="text-slate-400 group-hover:text-slate-600 shrink-0">
                  {link.isExternal ? (
                    <ExternalLink className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>
              </a>
            )
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 text-center">
        <span className="text-[11px] text-slate-400 font-medium">
          Digital Campus Information Portal
        </span>
      </div>
    </div>
  )
}
