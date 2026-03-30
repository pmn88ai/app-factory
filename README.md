# 🏭 App Factory — Hướng Dẫn Cài Đặt

Xưởng sản xuất app bằng AI. Quản lý workflow AI-assisted để tạo app qua copy/paste giữa ChatGPT và Claude.

---

## Tính Năng

- **Pipeline 8 bước**: Idea → Spec → Claude Review → GPT Fix → Claude Code → GPT Review → Final Check → Deploy
- **AI Assist**: Summarize / Improve / Review từng bước
- **⚡ Run Pipeline**: Chạy AI tự động tuần tự qua nhiều bước
- **Version history**: Lưu tối đa 10 version mỗi bước
- **Multi-project**: Dashboard quản lý nhiều project
- **Templates**: Lưu project làm template, tạo project mới từ template
- **Export / Import**: Xuất JSON, import có validation
- **Chia sẻ**: Tạo link public read-only, fork về tài khoản
- **Offline support**: Tự động sync khi có mạng lại
- **PWA**: Cài được trên mobile như app thật

---

## Yêu Cầu

- Node.js 18+
- Tài khoản [Supabase](https://supabase.com) (free tier đủ dùng)
- API key [Anthropic](https://console.anthropic.com)

---

## BƯỚC 1 — Setup Supabase

### 1a. Tạo project Supabase

Vào [supabase.com](https://supabase.com) → New Project → đặt tên → chọn region gần nhất.

### 1b. Bật Anonymous Auth

Vào **Authentication → Sign Providers → Anonymous** → bật ON.

### 1c. Chạy SQL migration

Vào **SQL Editor** trong Supabase dashboard, chạy **theo thứ tự** từng file:

**File — `supabase-migration-all.sql`** (cấu trúc cơ bản)
**File — `supabase-migration-v2.sql`** (thêm ID_app)
:
```sql
-- Chạy toàn bộ nội dung file supabase-migration.sql
```

### 1d. Lấy API keys

Vào **Project Settings → API**:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## BƯỚC 2 — Cài Đặt Local

```bash
# Giải nén và vào thư mục: C:/admin/user/
unzip app-factory-final.zip
cd app-factory-final

# Tạo file env
copy .env.example .env.local
```

Mở `.env.local` và điền:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx => Key API AI
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxx
```

```bash
# Cài dependencies
npm install

# Chạy dev server
npm run dev
```

Mở `http://localhost:3000` → tự redirect vào `/dashboard`.

---

## BƯỚC 3 — Deploy Vercel

```bash
# Init git
git init
git add .
git commit -m "feat: app factory v1.0"

# Push lên GitHub
git remote add origin https://github.com/YOUR_USERNAME/app-factory.git
git push -u origin main
```

Vào [vercel.com/new](https://vercel.com/new):
1. Import repo GitHub vừa tạo
2. Framework: **Next.js** (auto-detect)
3. Thêm 3 **Environment Variables** (giống `.env.local`)
4. Nhấn **Deploy**

---

## Cấu Trúc Project

```
app-factory/
│
├── app/                          # Next.js App Router
│   ├── page.jsx                  # Redirect → /dashboard
│   ├── layout.jsx                # Root layout + SessionProvider
│   ├── globals.css               # Tailwind + custom CSS
│   │
│   ├── dashboard/
│   │   └── page.jsx              # Danh sách project, search, import
│   │
│   ├── project/[id]/
│   │   └── page.jsx              # Pipeline editor + AI Chain
│   │
│   ├── templates/
│   │   └── page.jsx              # Template library
│   │
│   ├── share/[token]/
│   │   └── page.jsx              # Read-only shared view + Fork
│   │
│   └── api/
│       ├── ai/route.js           # AI Assist endpoint (Anthropic)
│       └── share/route.js        # Public share fetch (ẩn project.id)
│
├── components/
│   ├── Pipeline.jsx              # Render danh sách steps
│   ├── StepBlock.jsx             # 1 step: textarea + actions + chain state
│   ├── ActionBar.jsx             # Copy / Paste / AI Assist / Save Version
│   ├── AIAssistPanel.jsx         # Bottom sheet kết quả AI
│   ├── AiChainPanel.jsx          # Run Pipeline UI + per-step progress
│   ├── VersionDrawer.jsx         # Lịch sử version
│   ├── DeployKit.jsx             # Generate deploy instructions
│   ├── ProjectMenu.jsx           # Bottom sheet menu project
│   ├── SharePanel.jsx            # Toggle public/private + copy link
│   ├── ImportModal.jsx           # Import JSON với validation
│   └── SessionProvider.jsx       # Init Supabase anon session
│
├── hooks/
│   ├── useProject.js             # Load/save steps, offline sync, debounce
│   └── useAIChain.js             # Sequential AI execution + cancel
│
├── lib/
│   ├── supabase.js               # Supabase client + ensureAnonSession
│   ├── db.js                     # Tất cả DB operations
│   ├── storage.js                # localStorage helpers + STEP_META
│   ├── share.js                  # Token generation + share/fork ops
│   └── exportImport.js           # Build/validate/parse JSON export
│
├── public/
│   └── manifest.json             # PWA manifest
│
├── supabase-migration.sql        # Phase 2: schema gốc
├── supabase-migration-p3a.sql    # Phase 3A: is_template
├── supabase-migration-p3b.sql    # Phase 3B: share_token, is_public
│
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Cài App Trên Mobile (PWA)

**iOS (Safari):**
1. Mở URL app trên Safari
2. Nhấn nút Share (□↑)
3. Chọn "Thêm vào Màn Hình Chính"

**Android (Chrome):**
1. Mở URL app trên Chrome
2. Nhấn menu (⋮) → "Thêm vào màn hình chính"

---

## Lưu Ý Quan Trọng

- File icon PWA (`/public/icon-192.png` và `icon-512.png`) chưa có — mày cần tự thêm để PWA hiển thị icon đúng
- Supabase free tier giới hạn 500MB DB và 2GB bandwidth — đủ dùng cá nhân
- `share_token` được tạo bằng `crypto.getRandomValues` — không cần thêm thư viện nanoid
- Offline mode chỉ lưu localStorage, sync lên Supabase khi có mạng lại (last-write-wins)
