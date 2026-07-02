# On-Wax

A full-stack album rating app powered by Spotify. Users authenticate with Spotify, start a listening session for the album currently playing, rate each track, and get a final score.

## Tech Stack

### Backend
- Java 21, Spring Boot 3.5.12, Maven
- PostgreSQL 16 (Docker container `onwax-db`)
- Flyway migrations (V1-V8), Spring Data JPA, Lombok
- Caffeine cache, RestTemplate for Spotify API

### Frontend
- React (Vite), located in `on-wax-client/`
- Axios for API calls, React Router for navigation

## Project Structure

```
on-wax/
  src/main/java/com/onwax/
    config/          # SpotifyProperties, CacheConfig, WebConfig (CORS), SecurityConfig,
                     #   SpotifySessionAuthFilter, SpaCsrfTokenRequestHandler, CsrfCookieFilter
    controller/      # SpotifyController, SessionController, RatingController, UserController
    dto/             # NowPlayingDto, SessionDto, TrackRatingDto, SubmitRatingRequest, ProfileDto, EarnedBadgeDto
    entity/          # User, SpotifyToken, ListeningSession, TrackRating, Badge, UserBadge
    exception/       # GlobalExceptionHandler
    repository/      # UserRepository, SpotifyTokenRepository, SessionRepository, RatingRepository, BadgeRepository, UserBadgeRepository
    service/         # SpotifyService, SessionService, RatingService, UserService, BadgeService
  src/main/resources/
    db/migration/    # V1-V8 Flyway SQL migrations
    application.yml  # App config (datasource, Spotify OAuth creds)
  on-wax-client/
    src/api/         # Axios client (with 401 interceptor), spotifyApi, sessionApi, ratingApi
    src/components/  # NavBar
    src/pages/       # HomePage, SessionPage, ScorecardPage, HistoryPage, NotFoundPage
    src/assets/      # Images and inspiration folder
```

## Running Locally

1. Start Docker Desktop
2. `docker start onwax-db` (or `docker run` if first time)
3. `./mvnw spring-boot:run` — backend on http://127.0.0.1:8080
4. `cd on-wax-client && npm run dev` — frontend on http://127.0.0.1:5173

## Key Configuration

- Spotify redirect URI: `http://127.0.0.1:8080/spotify/callback`
- Spotify dashboard must use `http://127.0.0.1:8080/spotify/callback` (not localhost, not https)
- CORS allows `http://127.0.0.1:5173`
- Vite dev server binds to `127.0.0.1` (configured in vite.config.js)
- Session cookie used for auth (withCredentials: true)
- Frontend and backend must both use `127.0.0.1` (not `localhost`) for session cookies to work cross-origin

## API Endpoints

- `GET /spotify/login` — redirects to Spotify OAuth
- `GET /spotify/callback?code=` — exchanges code for tokens, sets session
- `GET /spotify/logout` — invalidates session
- `GET /spotify/now-playing` — current track (requires session)
- `POST /sessions` — start a rating session from current playback
- `GET /sessions/active` — get in-progress session
- `GET /sessions` — all sessions for user
- `GET /sessions/{id}` — session by ID
- `DELETE /sessions/{id}` — abandon an in-progress session
- `POST /ratings` — submit/update a track rating
- `GET /users/me` — current user's profile (requires session)
- `GET /users/me/badges` — current user's earned badges (requires session)
- `GET /users/{username}` — public profile by username
- `GET /users/{username}/badges` — public earned badges by username

## Commands

- Build backend: `./mvnw compile`
- Run tests: `./mvnw test` (badge engine integration test uses Testcontainers — requires Docker running)
- Run backend: `SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=xxx ./mvnw spring-boot:run`
- Run frontend: `cd on-wax-client && npm run dev`
- Build frontend: `cd on-wax-client && npx vite build`
- Health check: `GET /actuator/health`

## Pre-Production TODOs

This is the running checklist of what stands between the current build and a public,
real-users launch. When asked "where are we in development," start here.

### Feature roadmap (in progress)
1. **User auth/profiles** — DONE (users table + FK migration V6, profile endpoints, login upsert).
2. **Badge engine** — DONE (V7; HALF_ALBUM/FULL_ALBUM, per-album, only scored tracks count).
3. **Social layer** — NOT STARTED (follow graph, profile view rendering badges + stats; feed shape TBD).

### Hard blockers for a public launch
4. **Apply for Spotify Extended Quota Mode** — app is in Development Mode (max 25 manually-allowlisted
   users). Public signup requires Spotify's review (needs privacy policy + terms). Long lead time — start early.
5. **Rotate Spotify client secret** — old secret is in git history (and was pasted during a dev smoke test).
   Generate a new one in the Spotify dashboard; move all secrets to a secrets manager.
6. **Enforce HTTPS** — TLS termination + `Secure`/`SameSite` cookie attributes (platform-dependent).

### Security & auth hardening
7. **Add Spring Security + CSRF** — DONE. `SecurityConfig` + `SpotifySessionAuthFilter` (bridges the
   existing Spotify session into Spring Security); per-controller `session.getAttribute` checks replaced
   with `@AuthenticationPrincipal`; CSRF via `CookieCsrfTokenRepository` (SPA pattern, `XSRF-TOKEN`
   cookie / `X-XSRF-TOKEN` header), `/spotify/**` exempt.
8. **Authorization model for social** — DONE (public-profiles / Letterboxd model): profiles, badges, and
   follow graph are public GETs; feed/sessions/ratings/mutations require auth; ratings now enforce session
   ownership. Covered by `SecurityAuthorizationTest`.
9. **Encrypt refresh tokens at rest** — `spotify_tokens` stores them in plaintext.
10. **Move session storage off in-memory `HttpSession`** — sessions die on restart and don't work multi-instance
    (Redis or DB-backed).

### Correctness & data
11. **Add tests** — covered: badge engine (`BadgeServiceTest` unit + `BadgeEngineIntegrationTest`), and
    security authorization rules + CSRF (`SecurityAuthorizationTest`, MockMvc + Testcontainers). Still
    need: auth callback / token exchange, session lifecycle, follow-graph/feed behavior.
12. **Improve error handling/observability** — `exchangeCodeForTokens` wraps all failures in a generic
    `RuntimeException` and the cause gets swallowed in logs. Add real monitoring.
13. **Fix session-creation race** — "one IN_PROGRESS session per user" is app-enforced only; add a DB
    partial unique index.
14. **Schema cleanup** — drop the `spotify_user_id` fallback columns on `listening_sessions`/`spotify_tokens`
    once everything reads `user_id`.

### Ops & deployment
15. **Hosting + managed Postgres with backups** — migrations are forward-only and there's no backup story;
    config hardcodes `localhost`/`yourpassword` defaults.
16. **CI/CD + environment/secrets config.**
17. **Rate limiting** — home page polls now-playing every 5s per user; lean on the existing Caffeine cache
    + backoff to stay under Spotify's limits.

### Product & legal polish
18. **Privacy policy, terms, account/data deletion** — required by Spotify's quota review and for storing
    user data + tokens.
19. **Account lifecycle** — logout, handling Spotify access revocation, username editing (`PATCH /users/me`).
20. **Frontend UX** — the 401 interceptor hard-redirects to Spotify on any failure; styles are all inline;
    no error boundaries.
