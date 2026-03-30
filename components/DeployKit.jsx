'use client'
import { useState } from 'react'

function generateDeployKit(content) {
  const hasNext = content.toLowerCase().includes('next')
  const hasReact = content.toLowerCase().includes('react')
  const hasSupa = content.toLowerCase().includes('supabase')
  const hasAI = content.toLowerCase().includes('anthropic') || content.toLowerCase().includes('claude') || content.toLowerCase().includes('openai')

  const framework = hasNext ? 'Next.js' : hasReact ? 'React (Vite)' : 'Next.js'

  return `# 🚀 DEPLOY KIT — APP FACTORY
Tạo lúc: ${new Date().toLocaleString('vi-VN')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 CẤU TRÚC THƯ MỤC GỢI Ý (${framework})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

my-app/
├── app/
│   ├── layout.jsx
│   ├── page.jsx
│   ├── globals.css
│   └── api/
│       └── ai/
│           └── route.js
├── components/
│   ├── [Component1].jsx
│   └── [Component2].jsx
├── lib/
│   ├── utils.js
│   ${hasSupa ? '└── supabase.js' : '└── storage.js'}
├── public/
│   └── manifest.json
├── .env.local
├── next.config.js
├── tailwind.config.js
└── package.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ FILE .ENV.LOCAL (TEMPLATE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${hasAI ? 'ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx' : '# Không phát hiện AI API key'}
${hasSupa ? `
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_KEY=eyxxxxxxxxxxxxxxxxxxxxxxxxxx` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 HƯỚNG DẪN DEPLOY VERCEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BƯỚC 1 — Chuẩn bị repo GitHub
  git init
  git add .
  git commit -m "feat: initial commit"
  git branch -M main
  git remote add origin https://github.com/USERNAME/my-app.git
  git push -u origin main

BƯỚC 2 — Kết nối Vercel
  1. Vào https://vercel.com/new
  2. Import repo GitHub vừa tạo
  3. Framework: Next.js (auto detect)
  4. Root Directory: ./

BƯỚC 3 — Thêm Environment Variables
  Vào Settings → Environment Variables, thêm:
${hasAI ? '  - ANTHROPIC_API_KEY' : ''}
${hasSupa ? '  - NEXT_PUBLIC_SUPABASE_URL\n  - NEXT_PUBLIC_SUPABASE_ANON_KEY\n  - SUPABASE_SERVICE_KEY' : ''}

BƯỚC 4 — Deploy
  Nhấn "Deploy" → Đợi 2-3 phút
  → Vercel trả về link: https://my-app.vercel.app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CHECKLIST TRƯỚC KHI DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Đã test build local: npm run build
□ Không có error đỏ trong console
□ Đã thêm .env.local vào .gitignore
□ Đã thêm ENV vars vào Vercel
${hasSupa ? '□ Đã setup Supabase tables và RLS policies\n□ Đã test Supabase connection' : ''}
${hasAI ? '□ Đã verify API key hoạt động' : ''}
□ Đã test trên mobile (responsive)
□ Đã check manifest.json nếu là PWA
□ Đã check console không có warning quan trọng

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 SAU KHI DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Custom domain: Settings → Domains
- Analytics: Vercel Analytics (miễn phí)
- Logs: Functions → View Function Logs
- Redeploy: git push → tự động trigger
`
}

export default function DeployKit({ content, onGenerated }) {
  const [kit, setKit] = useState('')
  const [copied, setCopied] = useState(false)

  function handleGenerate() {
    const result = generateDeployKit(content || '')
    setKit(result)
    onGenerated(result)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(kit)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleGenerate}
        className="w-full py-4 bg-forge-accent text-forge-bg font-display font-bold text-base rounded-xl active:scale-95 transition-all hover:bg-forge-accentDim"
      >
        🚀 Tạo Deploy Kit
      </button>

      {kit && (
        <div className="bg-forge-card border border-forge-accent/20 rounded-xl overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-2 border-b border-forge-border">
            <span className="text-xs text-forge-accent font-medium">Deploy Kit đã tạo ✓</span>
            <button
              onClick={handleCopy}
              className="text-xs text-forge-muted hover:text-forge-text transition-colors"
            >
              {copied ? '✓ Đã copy' : '📋 Copy'}
            </button>
          </div>
          <pre className="p-4 text-xs text-forge-textDim font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-64 overflow-y-auto">
            {kit}
          </pre>
        </div>
      )}
    </div>
  )
}
