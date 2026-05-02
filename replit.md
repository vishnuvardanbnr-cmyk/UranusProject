# URANAZ TRADES — Investment Platform

## Project Overview
A full-featured investment platform with user and admin panels, dark navy + gold theme, mobile-first design with fixed bottom navigation.

## Architecture

### Monorepo Structure
```
artifacts/
  uranaz/          — React + Vite frontend (path: /)
  api-server/      — Express + Drizzle backend (path: /api)
lib/
  api-spec/        — OpenAPI spec + codegen config
  api-client-react/ — Generated React Query hooks
  api-zod/         — Generated Zod schemas
```

### Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS v4, Wouter (routing), TanStack Query, react-hook-form, Zod
- **Backend**: Express, Drizzle ORM, PostgreSQL
- **Auth**: HMAC-SHA256 signed tokens (SESSION_SECRET), stored in localStorage as `uranaz_token`
- **Codegen**: Orval (OpenAPI → React Query hooks + Zod schemas)

## Frontend Pages

### User Pages
- `/` — Landing page (investment plans, ranks, Singapore trip offer)
- `/login` — Login form
- `/register` — Registration with referral code support
- `/profile-setup` — Wallet address + country setup (post-registration)
- `/dashboard` — Balance, active investments, income breakdown, quick links
- `/invest` — Investment plan selection + calculator + new investment form
- `/income` — Income history with type filters (daily/referral/commission/rank)
- `/team` — Multi-level team structure with level commission details
- `/share` — Referral link + code + commission rate reference
- `/profile` — User profile edit (wallet, country, ID)
- `/withdrawals` — Withdrawal request form + history
- `/ranks` — 5-rank system with progress tracking
- `/terms` — Terms & Conditions
- `/privacy` — Privacy Policy

### Admin Pages
- `/admin` — Platform stats overview
- `/admin/users` — User list with status toggle
- `/admin/investments` — All investments list
- `/admin/withdrawals` — Withdrawal approval/rejection
- `/admin/settings` — Platform settings (min/max deposit, toggles)

## Backend API Routes

### Auth
- `POST /api/auth/register` — Register user (optional referralCode)
- `POST /api/auth/login` — Login, returns { user, token }
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Get current user
- `POST /api/auth/profile-setup` — Set wallet/country/ID

### User
- `GET /api/investments` — List user's investments
- `POST /api/investments` — Create investment
- `GET /api/income` — Income history with type filter
- `GET /api/income/summary` — Income summary + available balance
- `GET /api/team` — Team levels with members
- `GET /api/team/stats` — Team stats (total members, business, level progress)
- `GET /api/team/referral-link` — Referral code + link
- `GET /api/withdrawals` — User's withdrawal history
- `POST /api/withdrawals` — Submit withdrawal request
- `GET /api/ranks` — List all 5 ranks
- `GET /api/ranks/progress` — User's rank progress

### Admin (requireAdmin middleware)
- `GET /api/admin/stats` — Platform statistics
- `GET /api/admin/users` — All users (paginated)
- `PUT /api/admin/users/:id` — Update user status
- `GET /api/admin/investments` — All investments (paginated)
- `GET /api/admin/withdrawals` — All withdrawals (with status filter)
- `POST /api/admin/withdrawals/:id/approve` — Approve withdrawal
- `POST /api/admin/withdrawals/:id/reject` — Reject withdrawal
- `GET /api/admin/settings` — Platform settings
- `PUT /api/admin/settings` — Update platform settings

## Database Schema (Drizzle ORM, PostgreSQL)
- `users` — id, name, email, phone, password_hash, referral_code, sponsor_id, wallet_address, country, id_number, current_level, current_rank_id, is_admin, is_active, profile_complete, total_earnings, total_invested, created_at
- `investments` — id, user_id, amount, plan_tier, daily_rate, duration_days, earned_so_far, remaining_days, start_date, end_date, status, hyper_coin_amount, usdt_amount
- `income` — id, user_id, type, amount, description, from_user_id, created_at
- `withdrawals` — id, user_id, amount, wallet_address, status, note, processed_at, created_at
- `ranks` — id, rank_number, name, criteria, reward, requires_rank_id, requires_count, requires_levels
- `platform_settings` — key, value (JSON)

## Seed Data
- Admin: admin@uranaz.com / admin123
- Demo user: john@example.com / demo123 (Level 3, $1000 invested, 5 income records)
- Alice referral: alice@example.com (sponsored by john)

## Investment Plans
- Tier 1: $100–$400, 0.6%/day, 300 days
- Tier 2: $500–$900, 0.7%/day, 260 days (POPULAR)
- Tier 3: $1,000–$1,500, 0.8%/day, 225 days
- Min 50% HYPERCOIN required
- Multiples of $100

## Commission Structure
- L1: 20% of return, 80 days active, unlock $1k earned
- L2: 10% of return, 80 days active, unlock $3k earned
- L3: 10% of return, 60 days active, unlock $10k earned
- L4-L8: 4% each, 60 days active, unlock $10k earned
- Spot referral: 5% of investment amount (instant)

## Rank System (5 ranks)
1. Bronze Star → Smartphone (complete all 8 commission levels)
2. Silver Star → Laptop (3 rank-1 achievers in 3 legs)
3. Gold Star → Motor Bike (3 rank-2 achievers in 3 legs)
4. Platinum Star → Apple product (3 rank-3 achievers in 3 legs)
5. Diamond Star → Electric Car (3 rank-4 achievers in 3 legs)

## Singapore Trip Launch Offer
- Self investment ≥ $500
- Team business ≥ $25,000 across 3 legs (10k + 10k + 5k)

## Design
- Dark navy background (#070f1e area, hsl 222 47% 7%)
- Gold primary (#f6c343 area, hsl 43 96% 56%)
- Mobile-first, fixed bottom nav (5 items: Home, Dashboard, Invest, Team, Income)
- TopNav visible on desktop when logged in
- ScrollToTop button appears after 300px scroll
- Google Fonts: Inter + Rajdhani
