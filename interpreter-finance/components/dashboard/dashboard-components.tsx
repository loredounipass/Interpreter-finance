'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ArrowUpRight, BarChart3, CalendarDays, Check,
  Clock3, Flame, LayoutDashboard, LogOut, Menu, Plus, Settings2,
  Target, X, BadgeDollarSign, Wallet, CalendarRange, Trophy, MessageSquare,
  ListChecks, Pencil, Trash2,
} from 'lucide-react'
import { AIChat } from '@/components/ai/ai-chat'
import { ProgressChart } from './progress-chart'
import { useFinance } from '@/hooks/use-finance'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/app-toast'
import {
  getMinutesPerHour, getWholeMinutesPerHour,
  goalMinutes, defaultWorkHours,
} from '@/lib/finance'
import { formatMinutes, formatLongDate, computeEarnings } from '@/lib/finance'

type View = 'Overview' | 'Daily log' | 'Goals' | 'Earnings' | 'Insights' | 'AI chat' | 'Activity'

const VIEW_LABELS: Record<View, string> = {
  Overview: 'Overview',
  'Daily log': 'Daily log',
  Goals: 'Goals',
  Earnings: 'Earnings',
  Insights: 'Insights',
  'AI chat': 'interpreter AI',
  Activity: 'Activity',
}

function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-panel ${className}`}>{children}</section>
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>
}

export function Sidebar({ active, onNavigate, open, onClose }: { active: View; onNavigate: (view: View) => void; open: boolean; onClose: () => void }) {
  const items: { key: View; label: string; icon: React.ElementType }[] = [
    { key: 'Overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'Activity', label: 'Activity', icon: ListChecks },
    { key: 'Daily log', label: 'Daily log', icon: Clock3 },
    { key: 'Goals', label: 'Goals', icon: Target },
    { key: 'Earnings', label: 'Earnings', icon: Wallet },
    { key: 'Insights', label: 'Insights', icon: BarChart3 },
    { key: 'AI chat', label: 'interpreter AI', icon: MessageSquare },
  ]
  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/10 bg-sidebar/90 p-5 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
           <svg viewBox="0 0 192 180" className="w-5 h-5" aria-hidden="true">
             <path d="M0 0 C0 43.23 0 86.46 0 131 C-36 146 -36 146 -50 151 C-50.53429188 135.46724015 -50.94377798 119.93583376 -51.19167995 104.39604759 C-51.30990102 97.17847834 -51.47073625 89.96674702 -51.73510742 82.75292969 C-51.96566765 76.45865536 -52.11301574 70.16860566 -52.16403538 63.8702265 C-52.19386928 60.53523265 -52.27498805 57.22178785 -52.43179131 53.88892746 C-53.34295596 33.70828963 -53.34295596 33.70828963 -47.80192947 27.56171417 C-42.33746221 23.19316294 -36.33921402 20.21837576 -29.96905708 17.39952469 C-25.20566045 15.15420201 -20.88460374 12.27462038 -16.5 9.375 C-1.86731765 0 -1.86731765 0 0 0 Z" fill="#25A88D" transform="translate(185,3)"/>
             <path d="M0 0 C0 36.96 0 73.92 0 112 C-6.0440485 114.4176194 -11.86213874 116.71291661 -18.0546875 118.578125 C-18.76352081 118.79442566 -19.47235413 119.01072632 -20.20266724 119.23358154 C-21.67903813 119.68266821 -23.15608394 120.12954198 -24.63378906 120.57421875 C-26.89360038 121.25560848 -29.14994381 121.9477282 -31.40625 122.640625 C-32.85136723 123.07876958 -34.29667312 123.51629248 -35.7421875 123.953125 C-36.74691605 124.26240936 -36.74691605 124.26240936 -37.77194214 124.57794189 C-41.04631975 125.55433842 -43.5379413 126 -47 126 C-47.39488034 113.54391387 -47.69642452 101.08932818 -47.88080692 88.62824535 C-47.96933448 82.84080825 -48.08924265 77.0576682 -48.2824707 71.27270508 C-48.467991 65.68314745 -48.56897939 60.0977039 -48.61291313 54.50530434 C-48.64419077 52.37855531 -48.70528524 50.2520181 -48.79741096 48.12703514 C-49.47079549 31.94237155 -49.47079549 31.94237155 -45.36698151 27.05530357 C-41.3579391 23.62183947 -36.92066606 21.24511852 -32.15154457 19.03567886 C-28.84579426 17.44440542 -25.84302684 15.47866706 -22.7578125 13.49609375 C-20.54814421 12.14115713 -18.33723035 10.78824945 -16.125 9.4375 C-13.87707018 8.06206744 -11.62991552 6.68537751 -9.3828125 5.30859375 C-8.41746582 4.71876709 -7.45211914 4.12894043 -6.45751953 3.52124023 C-0.76905794 0 -0.76905794 0 0 0 Z" fill="#25A78B" transform="translate(120,38)"/>
             <path d="M0 0 C0 29.04 0 58.08 0 88 C-5.93346092 89.97782031 -11.58419312 91.7208057 -17.6484375 93.04296875 C-18.42764557 93.21629227 -19.20685364 93.38961578 -20.00967407 93.56819153 C-21.63761571 93.92918339 -23.2660716 94.28786358 -24.89501953 94.64428711 C-27.39103602 95.19101252 -29.88502916 95.74634028 -32.37890625 96.30273438 C-33.96863831 96.65415146 -35.55847832 97.00508069 -37.1484375 97.35546875 C-37.89217621 97.52104782 -38.63591492 97.68662689 -39.40219116 97.85722351 C-42.33221827 98.49487706 -44.99130055 99 -48 99 C-48.60699186 90.02206839 -49.06639053 81.05132237 -49.34711647 72.05724335 C-49.48201381 67.87789061 -49.6639624 63.71269093 -49.96142578 59.54150391 C-51.82454313 32.71869385 -51.82454313 32.71869385 -45.54037476 24.96533203 C-39.40722829 19.81129376 -32.68126671 16.56543014 -25.29618835 13.47802734 C-20.19427517 11.19030395 -15.6751197 8.13419987 -11.0625 5 C-9.55534574 4.01781864 -8.04658912 3.03808437 -6.53515625 2.0625 C-5.920354 1.66160156 -5.30555176 1.26070313 -4.67211914 0.84765625 C-3 0 -3 0 0 0 Z" fill="#27A88C" transform="translate(59,72)"/>
             <path d="M0 0 C0 19.8 0 39.6 0 60 C-5.65125 62.371875 -11.3025 64.74375 -17.125 67.1875 C-18.87699707 67.92508545 -20.62899414 68.6626709 -22.43408203 69.42260742 C-31.5335831 73.23632155 -40.66128011 76.81137744 -50 80 C-53.00519995 41.95684535 -53.00519995 41.95684535 -48.32861328 32.68701172 C-44.17962039 28.00908622 -39.07668908 25.41237852 -33.36279297 23.03417969 C-30.05739242 21.58742657 -27.62683723 19.69365384 -24.8125 17.4375 C-23.90242188 16.756875 -22.99234375 16.07625 -22.0546875 15.375 C-19.60777404 13.47254043 -17.20826017 11.53725223 -14.8203125 9.5625 C-14.09481201 8.96381104 -13.36931152 8.36512207 -12.62182617 7.74829102 C-11.18903291 6.56051549 -9.76188086 5.36589489 -8.34106445 4.16381836 C-7.69097412 3.62378174 -7.04088379 3.08374512 -6.37109375 2.52734375 C-5.5037561 1.79632446 -5.5037561 1.79632446 -4.61889648 1.05053711 C-3 0 -3 0 0 0 Z" fill="#1A957A" transform="translate(185,74)"/>
             <path d="M0 0 C0.33 0 0.66 0 1 0 C1 24.75 1 49.5 1 75 C-5.0440485 77.4176194 -10.86213874 79.71291661 -17.0546875 81.578125 C-17.76352081 81.79442566 -18.47235413 82.01072632 -19.20266724 82.23358154 C-20.67903813 82.68266821 -22.15608394 83.12954198 -23.63378906 83.57421875 C-25.89360038 84.25560848 -28.14994381 84.9477282 -30.40625 85.640625 C-31.85136723 86.07876958 -33.29667312 86.51629248 -34.7421875 86.953125 C-35.74691605 87.26240936 -35.74691605 87.26240936 -36.77194214 87.57794189 C-40.04631975 88.55433842 -42.5379413 89 -46 89 C-46 71.84 -46 54.68 -46 37 C-44 39 -44 39 -43.8046875 41.6015625 C-43.86979167 44.40104167 -43.93489583 47.20052083 -44 50 C-36.08923653 44.81757096 -28.45776592 39.3233402 -20.90625 33.6328125 C-17.82635211 31.31561373 -14.71233515 29.13555893 -11.46875 27.0546875 C-4.45770566 22.60129447 -4.45770566 22.60129447 -0.27490234 15.7265625 C0.61980714 10.4437144 0.46693569 5.31952047 0 0 Z" fill="#189177" transform="translate(119,75)"/>
             <path d="M0 0 C0 15.51 0 31.02 0 47 C-5.93346092 48.97782031 -11.58419312 50.7208057 -17.6484375 52.04296875 C-18.42764557 52.21629227 -19.20685364 52.38961578 -20.00967407 52.56819153 C-21.63761571 52.92918339 -23.2660716 53.28786358 -24.89501953 53.64428711 C-27.39103602 54.19101252 -29.88502916 54.74634028 -32.37890625 55.30273438 C-33.96863831 55.65415146 -35.55847832 56.00508069 -37.1484375 56.35546875 C-37.89217621 56.52104782 -38.63591492 56.68662689 -39.40219116 56.85722351 C-42.33221827 57.49487706 -44.99130055 58 -48 58 C-50.82375656 38.26025221 -50.82375656 38.26025221 -46.57177734 31.84521484 C-42.5187603 27.94696694 -37.61799404 25.33948967 -32.73046875 22.625 C-27.77951781 19.67851131 -23.33833539 16.05162674 -18.8125 12.5 C-2.58919146 0 -2.58919146 0 0 0 Z" fill="#169076" transform="translate(59,113)"/>
             <path d="M0 0 C0.33 0 0.66 0 1 0 C1 3.63 1 7.26 1 11 C-3.86860554 13.04947239 -8.73929181 15.09389563 -13.61181641 17.1340332 C-15.26276192 17.8260703 -16.91317038 18.51939029 -18.56298828 19.21411133 C-28.61516979 23.44580476 -38.67598856 27.47495844 -49 31 C-48.67 29.68 -48.34 28.36 -48 27 C-46.73542969 26.76410156 -45.47085938 26.52820313 -44.16796875 26.28515625 C-38.55451799 25.03808899 -33.53175806 22.8058085 -28.3125 20.4375 C-17.4220854 15.51253544 -17.4220854 15.51253544 -12 15 C-12 14.34 -12 13.68 -12 13 C-5.5 10 -5.5 10 -1 10 C-0.67 6.7 -0.34 3.4 0 0 Z" fill="#329E75" transform="translate(184,123)"/>
             <path d="M0 0 C-2.63983372 2.63983372 -4.67448548 2.75237087 -8.3203125 3.5078125 C-10.20556641 3.90419922 -10.20556641 3.90419922 -12.12890625 4.30859375 C-13.46090432 4.58089151 -14.79293603 4.85302481 -16.125 5.125 C-17.46498762 5.40425847 -18.80483346 5.68419818 -20.14453125 5.96484375 C-23.4283514 6.64995731 -26.71346986 7.32802817 -30 8 C-29.34 6.35 -28.68 4.7 -28 3 C-27.67 3.66 -27.34 4.32 -27 5 C-26.13375 4.731875 -25.2675 4.46375 -24.375 4.1875 C-16.42627378 1.92804612 -8.30310101 -0.27803382 0 0 Z" fill="#27946D" transform="translate(43,163)"/>
             <path d="M0 0 C0 6.6 0 13.2 0 20 C-2.34770643 16.47844036 -2.37669614 14.49228157 -2.625 10.3125 C-2.69976562 9.13300781 -2.77453125 7.95351562 -2.8515625 6.73828125 C-2.92503906 5.38283203 -2.92503906 5.38283203 -3 4 C-5.31 5.32 -7.62 6.64 -10 8 C-10 7.01 -10 6.02 -10 5 C-8.52227402 4.1641146 -7.04277811 3.33135744 -5.5625 2.5 C-4.32693359 1.80390625 -4.32693359 1.80390625 -3.06640625 1.09375 C-1 0 -1 0 0 0 Z" fill="#2FB199" transform="translate(185,3)"/>
             <path d="M0 0 C0 4.29 0 8.58 0 13 C-0.33 13 -0.66 13 -1 13 C-2.125 5.25 -2.125 5.25 -1 3 C-2.12148437 3.74056641 -2.12148437 3.74056641 -3.265625 4.49609375 C-4.25046875 5.13675781 -5.2353125 5.77742188 -6.25 6.4375 C-7.22453125 7.07558594 -8.1990625 7.71367188 -9.203125 8.37109375 C-11.61840249 9.77775676 -13.34348617 10.37242907 -16 11 C-16.33 11.66 -16.66 12.32 -17 13 C-17 12.01 -17 11.02 -17 10 C-15.54711914 8.74145508 -15.54711914 8.74145508 -13.53515625 7.51953125 C-12.81779297 7.07802734 -12.10042969 6.63652344 -11.36132812 6.18164062 C-10.60271484 5.72982422 -9.84410156 5.27800781 -9.0625 4.8125 C-7.93038086 4.11737305 -7.93038086 4.11737305 -6.77539062 3.40820312 C-1.1787095 0 -1.1787095 0 0 0 Z" fill="#34B097" transform="translate(120,38)"/>
             <path d="M0 0 C0.33 0 0.66 0 1 0 C1 4.29 1 8.58 1 13 C-9.04464286 17.15178571 -9.04464286 17.15178571 -14 18 C-14.33 17.34 -14.66 16.68 -15 16 C-13.5459375 15.814375 -13.5459375 15.814375 -12.0625 15.625 C-11.051875 15.41875 -10.04125 15.2125 -9 15 C-8.67 14.34 -8.34 13.68 -8 13 C-6.35448038 12.28272222 -4.68577711 11.61674772 -3 11 C-2.34 10.67 -1.68 10.34 -1 10 C-0.53248212 7.64400765 -0.53248212 7.64400765 -0.375 4.9375 C-0.30023438 4.01839844 -0.22546875 3.09929687 -0.1484375 2.15234375 C-0.09945312 1.44207031 -0.05046875 0.73179687 0 0 Z" fill="#2FA683" transform="translate(119,137)"/>
             <path d="M0 0 C0.33 0 0.66 0 1 0 C1 3.63 1 7.26 1 11 C-0.588125 11.66 -2.17625 12.32 -3.8125 13 C-4.70582031 13.37125 -5.59914062 13.7425 -6.51953125 14.125 C-9 15 -9 15 -12 15 C-12 14.34 -12 13.68 -12 13 C-5.5 10 -5.5 10 -1 10 C-0.67 6.7 -0.34 3.4 0 0 Z" fill="#31A783" transform="translate(184,123)"/>
             <path d="M0 0 C0.66 0.33 1.32 0.66 2 1 C0.61341021 2.15700194 -0.78472441 3.30017623 -2.1875 4.4375 C-2.96480469 5.07558594 -3.74210937 5.71367188 -4.54296875 6.37109375 C-7.12105934 8.08025715 -8.99916644 8.46617296 -12 9 C-12.33 9.66 -12.66 10.32 -13 11 C-12.87109375 9.23828125 -12.87109375 9.23828125 -12 7 C-9.34765625 5.04296875 -9.34765625 5.04296875 -6.0625 3.1875 C-4.98097656 2.56230469 -3.89945313 1.93710937 -2.78515625 1.29296875 C-1.86605469 0.86628906 -0.94695312 0.43960938 0 0 Z" fill="#37AD90" transform="translate(100,50)"/>
             <path d="M0 0 C0.99 0.495 0.99 0.495 2 1 C1.67 2.32 1.34 3.64 1 5 C1.66 5 2.32 5 3 5 C3.33 4.34 3.66 3.68 4 3 C7.6128101 1.55487596 10.06687842 1 14 1 C14 1.66 14 2.32 14 3 C12.4188708 3.50692692 10.83498617 4.00526443 9.25 4.5 C8.36828125 4.7784375 7.4865625 5.056875 6.578125 5.34375 C4 6 4 6 0 6 C0 4.02 0 2.04 0 0 Z" fill="#2E9B72" transform="translate(73,158)"/>
             <path d="M0 0 C0.99 0.33 1.98 0.66 3 1 C-6.04656319 7.5631929 -6.04656319 7.5631929 -9 9 C-11.14453125 8.5703125 -11.14453125 8.5703125 -13 8 C-10.90320896 6.63304778 -8.7989062 5.28153009 -6.6875 3.9375 C-6.09259766 3.54755859 -5.49769531 3.15761719 -4.88476562 2.75585938 C-3.30390365 1.75788505 -1.65405288 0.87131304 0 0 Z" fill="#37AF8D" transform="translate(153,22)"/>
             <path d="M0 0 C0 0.66 0 1.32 0 2 C-5.10334017 3.905247 -9.46342706 5.42589023 -15 5 C-15 4.67 -15 4.34 -15 4 C-13.35 4 -11.7 4 -10 4 C-9.67 3.01 -9.34 2.02 -9 1 C-6.03421164 -0.16513114 -3.15436364 -0.08762121 0 0 Z" fill="#2FA279" transform="translate(103,154)"/>
             <path d="M0 0 C0.66 0.66 1.32 1.32 2 2 C-0.97 3.65 -3.94 5.3 -7 7 C-7 6.01 -7 5.02 -7 4 C-4.69 2.68 -2.38 1.36 0 0 Z" fill="#34B194" transform="translate(55,73)"/>
             <path d="M0 0 C0 0.66 0 1.32 0 2 C-5.29411765 6 -5.29411765 6 -9 6 C-9 5.34 -9 4.68 -9 4 C-2.25 0 -2.25 0 0 0 Z" fill="#39B297" transform="translate(168,14)"/>
             <path d="M0 0 C0 0.99 0 1.98 0 3 C-2.31 4.32 -4.62 5.64 -7 7 C-7 6.01 -7 5.02 -7 4 C-4.69 2.68 -2.38 1.36 0 0 Z" fill="#3FB697" transform="translate(182,4)"/>
           </svg>
          </div>
          <div>
            <p className="text-sm font-semibold">Interpreter</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Finance</p>
          </div>
        </div>
        <button className="lg:hidden" onClick={onClose} aria-label="Close menu"><X className="size-4" /></button>
      </div>
      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-8">
        <div>
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Activity</p>
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <button key={item.key} onClick={() => { onNavigate(item.key); onClose() }} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${active === item.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
                <item.icon className="size-4" />{item.label}
                {active === item.key && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-auto">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Manage</p>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5"><Settings2 className="size-4" />Settings</button>
          <SignOutButton />
        </div>
      </nav>
    </aside>
  )
}

function SignOutButton() {
  const { signOut } = useAuth()
  return (
    <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-400">
      <LogOut className="size-4" />Sign out
    </button>
  )
}

export function Header({ view, onMenu }: { view: View; onMenu: () => void }) {
  const { user } = useAuth()
  const firstName = user?.first_name ?? ''
  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 lg:px-10">
      <div className="flex items-center gap-3">
        <button className="lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu className="size-5" /></button>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{VIEW_LABELS[view]}</p>
          <h1 className="mt-1 text-lg font-semibold">{greeting}, {firstName}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:flex">
          <span className="size-1.5 rounded-full bg-primary" />Synced just now
        </span>
        <div className="grid size-9 place-items-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">{initials}</div>
      </div>
    </header>
  )
}

export function StatCard({ label, value, note, icon: Icon, large = false, size }: { label: string; value: string; note: string; icon: React.ElementType; large?: boolean; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const valueSizes = { sm: 'font-mono text-xl font-medium', md: 'font-mono text-2xl font-medium', lg: 'font-mono text-4xl font-bold', xl: 'font-mono text-5xl font-bold' }
  const effective = size ?? (large ? 'xl' : 'md')
  const isLarge = effective === 'xl' || effective === 'lg'
  const labelSize = isLarge ? 'text-sm font-semibold text-muted-foreground' : 'text-xs text-muted-foreground'
  const valueSize = valueSizes[effective]
  const noteSize = isLarge ? 'text-base text-muted-foreground' : 'text-xs text-muted-foreground'
  const iconSize = isLarge ? 'size-6' : 'size-4'
  
  // Special styling for earnings cards
  const isEarnings = label.toLowerCase().includes('earnings')
  const earningsGradient = isEarnings ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20' : ''
  const earningsIconBg = isEarnings ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/15 text-primary'
  const earningsValueColor = isEarnings ? 'text-emerald-400' : ''
  
  return (
    <Glass className={`flex min-h-28 flex-col items-start p-3.5 ${earningsGradient}`}>
      <div className="flex items-center gap-2">
        <div className={`grid size-7 place-items-center rounded-md ${earningsIconBg}`}><Icon className={iconSize} /></div>
        <p className={labelSize}>{label}</p>
      </div>
      <p className={`${valueSize} ${earningsValueColor}`} style={{ marginTop: isLarge ? '0.5rem' : '0.25rem' }}>{value}</p>
      {note && <p className={noteSize} style={{ marginTop: isLarge ? '0.25rem' : '0.125rem' }}>{note}</p>}
    </Glass>
  )
}

export function GoalCard() {
  const { currentMinutes, goal, progress, addMinutes, setMinutes, saveMinutes, isSaving } = useFinance()
  const toast = useToast()
  const [draftMins, setDraftMins] = useState('')

  const handleSave = async () => {
    const saved = Number(currentMinutes.toFixed(2))
    await saveMinutes()
    if (goal > 0 && saved >= goal) {
      toast({
        title: 'Goal reached! 🎉',
        description: `You hit your ${goal} minute goal.`,
        variant: 'success',
      })
    } else {
      toast({
        title: 'Log saved',
        description: saved > 0 ? `${saved} minutes logged for today.` : undefined,
        variant: 'info',
      })
    }
  }

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (draftMins && Number(draftMins) > 0) {
      addMinutes(Number(draftMins))
      setDraftMins('')
    }
  }
  return (
    <Glass className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>Today&apos;s focus</Eyebrow>
          <h2 className="mt-2 text-xl font-semibold">Keep the momentum</h2>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary">
          {goal > 0 ? (goal - currentMinutes > 0 ? `${Number((goal - currentMinutes).toFixed(2))} min remaining` : 'Goal reached! 🎉') : 'No goal set'}
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="font-mono text-4xl font-medium">{Number(currentMinutes.toFixed(2))}</span>
          <span className="ml-2 text-sm text-muted-foreground">minutes logged</span>
        </div>
        <span className="font-mono text-sm text-primary">{progress}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[15, 30, 45].map((value) => (
          <button key={value} onClick={() => addMinutes(value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-muted-foreground hover:border-primary/30 hover:text-primary">
            +{value}m
          </button>
        ))}
        
        <form onSubmit={handleAdd} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 focus-within:border-primary/50">
          <span className="text-xs text-muted-foreground">+</span>
          <input 
            type="number" 
            min="0.01" 
            step="any"
            placeholder="custom"
            value={draftMins} 
            onChange={(e) => setDraftMins(e.target.value)} 
            className="w-14 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/30" 
          />
          <button type="submit" disabled={!draftMins} className="px-2 text-xs font-semibold text-primary disabled:opacity-50">Add</button>
        </form>

        <button onClick={handleSave} disabled={isSaving} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save log'}
        </button>
        <button onClick={() => setMinutes(0)} className="ml-auto rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground">Reset</button>
      </div>
    </Glass>
  )
}

export function GoalSettings() {
  const { goal: hookGoal, workHours: hookWorkHours, ratePerMinute: hookRatePerMinute, saveGoal } = useFinance()
  const toast = useToast()
  // Use string state so the fields can be cleared and typed freely (e.g. 24, 50)
  // without snapping back to 0 or being capped.
  const [goal, setGoal] = useState(String(hookGoal))
  const [workHours, setWorkHoursLocal] = useState(String(hookWorkHours))
  const [ratePerMinute, setRatePerMinute] = useState(String(hookRatePerMinute))

  // Sync local state when hook loads data from Supabase
  useEffect(() => { setGoal(String(hookGoal)) }, [hookGoal])
  useEffect(() => { setWorkHoursLocal(String(hookWorkHours)) }, [hookWorkHours])
  useEffect(() => { setRatePerMinute(String(hookRatePerMinute)) }, [hookRatePerMinute])

  const numGoal = Number(goal) || 0
  const numWorkHours = Number(workHours) || 0
  const numRate = Number(ratePerMinute) || 0

  const minutesPerHour = getMinutesPerHour(numGoal, numWorkHours)
  const wholeMinutesPerHour = getWholeMinutesPerHour(numGoal, numWorkHours)

  const clearAll = () => {
    setGoal('')
    setWorkHoursLocal('')
    setRatePerMinute('')
  }

  const handleSaveGoal = async () => {
    await saveGoal(numGoal, numWorkHours, numRate)
    toast({
      title: 'Goal updated',
      description: `Daily target set to ${numGoal} minutes.`,
      variant: 'success',
    })
  }

  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>Daily target</Eyebrow>
          <p className="mt-1 text-sm text-muted-foreground">Set your goal and available work period.</p>
        </div>
        <Target className="size-5 text-primary" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Goal minutes</span>
          <input type="number" min="0" step="any" value={goal} onChange={(e) => setGoal(e.target.value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-lg outline-none focus:border-primary/50" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Work period</span>
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="any" value={workHours} onChange={(e) => setWorkHoursLocal(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-lg outline-none focus:border-primary/50" />
            <span className="text-xs text-muted-foreground">hours</span>
          </div>
        </label>
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Rate per minute</span>
          <input type="number" min="0" step="0.01" value={ratePerMinute} onChange={(e) => setRatePerMinute(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-lg outline-none focus:border-primary/50" />
        </label>
      </div>
      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-4">
        <p className="text-xs text-muted-foreground">Required pace per hour</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-3xl text-primary">{minutesPerHour}</span>
          <span className="text-sm text-muted-foreground">minutes / hour</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          For {numGoal} minutes across {numWorkHours} hours, plan about <span className="font-semibold text-foreground">{wholeMinutesPerHour} minutes every hour</span>.
        </p>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={handleSaveGoal} className="flex-1 rounded-lg border border-primary/25 bg-primary/10 py-2.5 text-xs font-semibold text-primary">Update daily goal</button>
        <button onClick={clearAll} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground">Clear</button>
      </div>
    </Glass>
  )
}

export function ActivityList() {
  const { recentEntries } = useFinance()
  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between">
        <div><Eyebrow>Recent activity</Eyebrow><h2 className="mt-1 text-lg font-semibold">Latest logs</h2></div>
        <button className="flex items-center gap-1 text-xs text-primary">View all <ArrowUpRight className="size-3.5" /></button>
      </div>
      <div className="mt-5 flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
        {recentEntries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No practice logged yet.</p>
        ) : (
          recentEntries.map((entry, i) => (
            <div key={entry.date + i} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-white/[0.04]">
              <div className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary"><Clock3 className="size-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.note}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{entry.date}</p>
              </div>
              <span className="font-mono text-sm">{entry.minutes}m</span>
            </div>
          ))
        )}
      </div>
    </Glass>
  )
}

export function CalendarCard() {
  const { calendarDays, goal } = useFinance()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const firstWeekday = new Date(year, month, 1).getDay()

  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>Monthly rhythm</Eyebrow>
          <h2 className="mt-1 text-lg font-semibold">{now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-primary" />
          <span>logged</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`wd-${i}`} className="text-center font-mono text-[10px] uppercase text-muted-foreground">{d}</div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {calendarDays.map((cell) => {
          const intensity = goal > 0 ? Math.min(cell.minutes / goal, 1) : cell.minutes > 0 ? 1 : 0
          const pct = Math.round(15 + intensity * 60)
          const isToday = cell.day === today
          const bg = cell.minutes === 0
            ? 'rgba(255,255,255,0.03)'
            : `color-mix(in oklab, var(--primary) ${pct}%, transparent)`
          return (
            <div
              key={cell.day}
              title={cell.minutes > 0 ? `${cell.minutes} min logged` : 'No minutes logged'}
              style={{ backgroundColor: bg }}
              className={`grid aspect-square place-items-center rounded-md text-xs ${isToday ? 'font-bold text-primary ring-1 ring-primary' : cell.minutes > 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`}
            >
              {cell.day}
            </div>
          )
        })}
      </div>
    </Glass>
  )
}

export function MonthlyChart() {
  const { goal, chartData } = useFinance()
  return (
    <Glass className="h-fit p-4">
      <div>
        <Eyebrow>Progress over time</Eyebrow>
        <h2 className="mt-1 text-base font-semibold">Interpretation minutes</h2>
        <p className="mt-1 text-xs text-muted-foreground">Daily minutes compared with the {goal} minute goal.</p>
      </div>
      <div className="mt-3"><ProgressChart data={chartData} /></div>
    </Glass>
  )
}

function ActivityView() {
  const { logs, updateEntry, deleteEntry, todayTotal, monthTotal } = useFinance()

  const [savingId, setSavingId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editMins, setEditMins] = useState('')
  const [editNote, setEditNote] = useState('')

  // Individual entries, most recently touched first ("Latest logs").
  const entries = useMemo(
    () => [...logs].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))),
    [logs]
  )

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const startEdit = (id: string, minutes: number, note: string | null) => {
    setEditId(id)
    setEditMins(String(minutes))
    setEditNote(note ?? '')
  }

  const saveEdit = async () => {
    if (!editId) return
    const mins = Number(editMins)
    if (!Number.isFinite(mins) || mins < 0) return
    setSavingId(editId)
    await updateEntry(editId, mins, editNote.trim() || null)
    setSavingId(null)
    setEditId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid divide-y divide-white/[0.1] border-y border-white/[0.1] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-3">
        <StatCard label="Today's total" value={`${Number(todayTotal.toFixed(2))}m`} note="Across all sessions" icon={Clock3} />
        <StatCard label="Month total" value={formatMinutes(monthTotal)} note="This month" icon={Target} />
        <StatCard label="Entries" value={`${entries.length}`} note="Individual logs" icon={ListChecks} />
      </div>

      <Glass className="p-5">
        <div className="flex items-center justify-between">
          <div><Eyebrow>Recent activity</Eyebrow><h2 className="mt-1 text-lg font-semibold">Latest logs</h2></div>
          <span className="font-mono text-xs text-muted-foreground">{entries.length} total</span>
        </div>
        <div className="mt-4 flex flex-col gap-1 max-h-[540px] overflow-y-auto pr-1">
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No entries yet. Add your first minutes above.</p>
          ) : (
            entries.map((e) => {
              const editing = editId === e.id
              return (
                <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-xl px-2 py-3 hover:bg-white/[0.04]">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><Clock3 className="size-4" /></div>
                  {editing ? (
                    <>
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <input
                          type="number" min="0" step="any" inputMode="decimal"
                          value={editMins} onChange={(ev) => setEditMins(ev.target.value)}
                          onKeyDown={(ev) => ev.key === 'Enter' && saveEdit()}
                          className="w-20 rounded-lg border border-primary/30 bg-white/[0.05] px-2 py-1.5 font-mono text-sm outline-none"
                        />
                        <input
                          type="text" value={editNote} onChange={(ev) => setEditNote(ev.target.value)}
                          onKeyDown={(ev) => ev.key === 'Enter' && saveEdit()}
                          placeholder="Note"
                          className="min-w-[140px] flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-sm outline-none focus:border-primary/50"
                        />
                        <span className="text-xs text-muted-foreground">{fmtDate(e.updated_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={saveEdit} disabled={savingId === e.id} aria-label="Save" className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-50">
                          <Check className="size-4" />
                        </button>
                        <button onClick={() => setEditId(null)} aria-label="Cancel" className="grid size-8 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-foreground">
                          <X className="size-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.note || 'Daily practice'}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{fmtDate(e.updated_at)}</p>
                      </div>
                      <span className="shrink-0 font-mono text-sm">{Number(e.minutes.toFixed(2))}m</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(e.id, e.minutes, e.note)} aria-label="Edit" className="grid size-8 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-foreground">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => deleteEntry(e.id)} aria-label="Delete" className="grid size-8 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:border-red-500/40 hover:text-red-400">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Glass>
    </div>
  )
}

function Operations() {
  const { currentMinutes, todayTotal, goal, monthTotal, goalHitRate, completedDays, summary, weekDelta, todayEarnings, monthEarnings } = useFinance()
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  return (
    <>
      <div className="grid divide-y divide-white/[0.1] border-y border-white/[0.1] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
        <StatCard label="Minutes logged today" value={`${Number(todayTotal.toFixed(2))}m`} note={goal > 0 ? (goal - todayTotal > 0 ? `${Number((goal - todayTotal).toFixed(2))}m left` : 'Completed') : 'No goal set'} icon={Clock3} />
        <StatCard label="Today's Earnings" value={`$${todayEarnings.toFixed(2)}`} note={`$${monthEarnings.toFixed(2)} this month`} icon={BadgeDollarSign} />
        <StatCard label="Monthly total" value={formatMinutes(monthTotal)} note={`${weekDelta} vs last month`} icon={Target} />
        <StatCard label="Goal completion" value={`${goalHitRate}%`} note={`${completedDays} of ${daysInMonth} days`} icon={Check} />
        <StatCard label="Current streak" value={`${summary.streak}d`} note="Keep it going!" icon={Flame} />
      </div>
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
        <div className="flex flex-col gap-4">
          <MonthlyChart />
          <ActivityList />
        </div>
        <div className="flex flex-col gap-4">
          <GoalCard />
          <GoalSettings />
          <CalendarCard />
        </div>
      </div>
    </>
  )
}

function DailyLog() {
  const { todayEarnings } = useFinance()
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <StatCard label="Today's Earnings" value={`$${todayEarnings.toFixed(2)}`} note="" icon={BadgeDollarSign} size="lg" />
      <GoalCard /><ActivityList /><CalendarCard />
    </div>
  )
}

function Goals() {
  const { goal, goalHitRate, summary, dailyData } = useFinance()
  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <GoalSettings />
      <Glass className="p-6">
        <Eyebrow>Goal performance</Eyebrow>
        <h2 className="mt-1 text-xl font-semibold">Your target, in context</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatCard label="Daily goal" value={`${goal}m`} note="Current target" icon={Target} />
          <StatCard label="Hit rate" value={`${goalHitRate}%`} note="This month" icon={Check} />
          <StatCard label="Current streak" value={`${summary.streak}d`} note="Keep going!" icon={Flame} />
        </div>
        
        <div className="mt-8">
          <Eyebrow>Progress over time</Eyebrow>
          <h2 className="mt-1 text-xl font-semibold">Interpretation minutes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Daily minutes compared with the {goal} minute goal.</p>
          <div className="mt-4 h-[200px] w-full">
            <ProgressChart data={dailyData} />
          </div>
        </div>
      </Glass>
    </div>
  )
}

function Insights() {
  const { weeklyData, monthTotal, goalHitRate } = useFinance()
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Monthly total" value={formatMinutes(monthTotal)} note="Trending upward" icon={Clock3} />
        <StatCard label="Average session" value={`${Math.round(monthTotal / Math.max(weeklyData.length, 1))}m`} note={`Across ${weeklyData.length} sessions`} icon={BarChart3} />
        <StatCard label="Consistency" value={`${goalHitRate}%`} note="Strong rhythm" icon={Flame} />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <MonthlyChart />
        <Glass className="h-fit p-4">
          <Eyebrow>Weekly breakdown</Eyebrow>
          <h2 className="mt-1 text-base font-semibold">Where your time went</h2>
          <div className="mt-4 flex flex-col gap-4">
            {weeklyData.map((week) => (
              <div key={week.week} className="flex items-center gap-4">
                <span className="w-8 font-mono text-xs text-muted-foreground">{week.week}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((week.actual / 560) * 100)}%` }} />
                </div>
                <span className="w-12 text-right font-mono text-xs">{formatMinutes(week.actual)}</span>
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </div>
  )
}

function Earnings() {
  const { logs, goal, ratePerMinute } = useFinance()
  const { todayEarnings, weekEarnings, monthEarnings, yearEarnings, totalEarnings, qualifiedDays } = useMemo(
    () => computeEarnings(logs, goal, ratePerMinute),
    [logs, goal, ratePerMinute]
  )
  const qualifiedCount = qualifiedDays.filter((d) => d.qualified).length

  return (
    <div className="flex flex-col gap-4">
      <div className="grid divide-y divide-white/[0.1] border-y border-white/[0.1] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
        <StatCard label="Today" value={`$${todayEarnings.toFixed(2)}`} note="Goal met days only" icon={BadgeDollarSign} />
        <StatCard label="This week" value={`$${weekEarnings.toFixed(2)}`} note="Last 7 days" icon={CalendarDays} />
        <StatCard label="This month" value={`$${monthEarnings.toFixed(2)}`} note="Current month" icon={CalendarRange} />
        <StatCard label="This year" value={`$${yearEarnings.toFixed(2)}`} note="Current year" icon={BarChart3} />
        <StatCard label="Total" value={`$${totalEarnings.toFixed(2)}`} note="All time" icon={Wallet} />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <Glass className="p-5">
          <div className="flex items-center justify-between">
            <div><Eyebrow>Qualified days</Eyebrow><h2 className="mt-1 text-lg font-semibold">Days that hit the goal</h2></div>
            <span className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary"><Trophy className="size-3.5" />{qualifiedCount} of {qualifiedDays.length} days</span>
          </div>
          <div className="mt-5 flex flex-col gap-1 max-h-[400px] overflow-y-auto pr-1">
            {qualifiedDays.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Log some minutes to see your earnings.</p>
            ) : (
              qualifiedDays.map((d) => (
                <div key={d.date} className={`flex items-center gap-3 rounded-xl px-2 py-3 ${d.qualified ? '' : 'opacity-50'}`}>
                  <div className={`grid size-9 place-items-center rounded-lg ${d.qualified ? 'bg-primary/15 text-primary' : 'bg-white/[0.06] text-muted-foreground'}`}>
                    {d.qualified ? <Check className="size-4" /> : <Clock3 className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.note || 'Daily practice'}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatLongDate(d.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{d.qualified ? `$${d.earnings.toFixed(2)}` : '$0.00'}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{d.minutes}m {goal > 0 ? `/ ${goal}m` : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Glass>
        <Glass className="h-fit p-5">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-1 text-base font-semibold">Goal-based pay</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            You earn on days where you hit your daily goal of <span className="font-semibold text-foreground">{goal}m</span> at{' '}
            <span className="font-semibold text-foreground">${ratePerMinute.toFixed(2)}/minute</span>.
          </p>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-muted-foreground">Daily rate check</p>
            <p className="mt-1 font-mono text-2xl">${Number((goal * ratePerMinute).toFixed(2))}/day</p>
            <p className="mt-1 text-[10px] text-muted-foreground">if you meet your {goal}m goal</p>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-muted-foreground">Potential monthly total</p>
            <p className="mt-1 font-mono text-2xl">${Number((goal * ratePerMinute * 22).toFixed(2))}/month</p>
            <p className="mt-1 text-[10px] text-muted-foreground">at ~22 qualified days</p>
          </div>
        </Glass>
      </div>
    </div>
  )
}

export function Dashboard() {
  const [active, setActive] = useState<View>('Overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const { summaryMessage } = useFinance()
  
  useEffect(() => {
    const saved = localStorage.getItem('dashboard_view') as View
    if (saved && ['Overview', 'Activity', 'Daily log', 'Goals', 'Earnings', 'Insights', 'AI chat'].includes(saved)) {
      setActive(saved)
    }
  }, [])

  const handleNavigate = (view: View) => {
    setActive(view)
    localStorage.setItem('dashboard_view', view)
  }

  const content = active === 'Overview' ? <Operations /> : active === 'Activity' ? <ActivityView /> : active === 'Daily log' ? <DailyLog /> : active === 'Goals' ? <Goals /> : active === 'Earnings' ? <Earnings /> : active === 'AI chat' ? <AIChat /> : <Insights />
  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full">
        <Sidebar active={active} onNavigate={handleNavigate} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="min-w-0 flex-1 flex flex-col h-full overflow-y-auto">
          <Header view={active} onMenu={() => setMenuOpen(true)} />
          <main className={active === 'AI chat' ? 'w-full flex-1 min-h-0 p-0' : 'mx-auto w-full max-w-[1280px] flex-1 p-4 lg:p-7'}>
            {active !== 'AI chat' && (
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                    {active === 'Overview' ? <>Your practice,<br className="sm:hidden" /> in perspective.</> : VIEW_LABELS[active]}
                  </h2>
                </div>
                <button onClick={() => handleNavigate('Daily log')} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20">
                  <Plus className="size-4" />Log minutes
                </button>
              </div>
            )}
            {content}
            {active !== 'AI chat' && (
              <footer className="mt-10 flex justify-between gap-2 border-t border-white/10 pt-5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Interpreter Finance · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>{summaryMessage}</span>
              </footer>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
