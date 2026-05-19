# CritCine

CritCine is a full-stack movie review and discovery platform built as a portfolio project. Users can search movies, write reviews, manage a personal watchlist, follow other users, and browse what's streaming — all powered by the TMDB public API.

## Features

- **Movie Discovery** — Hero carousel with now-playing films, trending this week, Top 10 in Brazil, classics, and personalised "For You" recommendations based on favourite genres
- **Search** — Fast title search and filter by genre across the entire TMDB catalogue, with genre sort and sessionStorage caching on back-navigation
- **Streaming** — Browse movies available on Netflix, Disney+, Prime Video and more; filter by genre, sort by rating, and search within the provider's library
- **Movie Details** — Full info page with cast, director, runtime, where-to-watch, and YouTube trailer embed
- **Reviews & Ratings** — Star-rated reviews with comments, like/unlike toggle, and a global feed sorted by newest, oldest, or most popular
- **Trending Reviews** — Spotlight on the most-liked review, top-reviewer leaderboard, and a horizontally scrollable Most Liked carousel
- **Social** — Follow/unfollow users, view followers and following lists, dedicated Following feed grouped by user
- **Profile** — Edit name, avatar, cover photo, and favourite genres; view your watchlist and review history
- **Watchlist** — Track movies as *want to watch*, *watching*, *watched*, or *dropped*
- **Security** — JWT stored in cookies, automatic 401 redirect, inactivity logout after 60 minutes

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix UI |
| HTTP Client | Axios |
| Auth | JWT via cookies (js-cookie) |
| Notifications | Sonner |
| Movie Data | TMDB Public API (via backend proxy) |
| Backend | FastAPI (Python) — hosted on Railway |

## Getting Started

### Prerequisites

- Node.js 18+
- A running CritCine backend instance (or point `NEXT_PUBLIC_API_URL` at the hosted one — the app defaults to the production URL so it works without any extra config)

### Installation

```bash
git clone https://github.com/FerrariRafaello/critcine-frontend.git
cd critcine-frontend
npm install
```

### Environment

Create a `.env.local` file at the project root (optional — falls back to production API):

```env
NEXT_PUBLIC_API_URL=https://critcine-production-95d5.up.railway.app
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/        # Sign-in page
│   │   └── register/     # Sign-up with CPF validation and terms modal
│   ├── movies/[id]/      # Movie detail — info, cast, trailer, reviews, watchlist
│   ├── profile/          # User profile — stats, reviews, watchlist, follow system
│   ├── reviews/          # Global & following feeds, trending section
│   ├── streaming/[id]/   # Provider library — search, genre filter, rating sort
│   ├── globals.css       # Global styles and custom utilities
│   ├── layout.tsx        # Root layout — fonts, theme, toast provider
│   └── page.tsx          # Home — hero carousel, movie rows, streaming providers
├── components/
│   ├── ui/               # shadcn/ui base components
│   ├── NavBar.tsx        # Responsive navbar with hamburger menu
│   ├── StarRating.tsx    # Interactive and read-only star rating
│   ├── LogoutDialog.tsx  # Logout confirmation dialog
│   ├── EditProfileDialog.tsx    # Profile edit modal
│   ├── AvatarPickerDialog.tsx   # Avatar selection modal
│   └── CoverPickerDialog.tsx    # Cover photo selection modal
├── hooks/
│   └── useInactivityLogout.ts  # Auto-logout hook after N minutes of inactivity
├── lib/
│   ├── api.ts            # Axios instance — JWT interceptor and 401 auto-redirect
│   ├── auth.ts           # login / register / logout / isAuthenticated utilities
│   ├── profile-options.ts # Static avatar and cover image options
│   └── utils.ts          # Tailwind class merge helper (cn)
└── types/
    └── index.ts          # Shared TypeScript interfaces
```

## API

All movie data is sourced from the **TMDB** public API, proxied through the FastAPI backend. The backend also handles authentication, reviews, watchlist entries, and follow relationships. No TMDB API key is needed on the frontend.

## Author

**Rafaello Ferrari** — personal portfolio project, non-commercial.

- [LinkedIn](https://www.linkedin.com/in/rafaello-ferrari-0ba87a349/)
- [GitHub](https://github.com/FerrariRafaello)

---

*Movie data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.*
