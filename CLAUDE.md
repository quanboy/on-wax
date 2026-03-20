# On-Wax

A full-stack album rating app powered by Spotify. Users authenticate with Spotify, start a listening session for the album currently playing, rate each track, and get a final score.

## Tech Stack

### Backend
- Java 21, Spring Boot 3.5.12, Maven
- PostgreSQL 16 (Docker container `onwax-db`)
- Flyway migrations (V1-V4), Spring Data JPA, Lombok
- Caffeine cache, RestTemplate for Spotify API

### Frontend
- React (Vite), located in `on-wax-client/`
- Axios for API calls, React Router for navigation

## Project Structure

```
on-wax/
  src/main/java/com/onwax/
    config/          # SpotifyProperties, CacheConfig, WebConfig
    controller/      # SpotifyController, SessionController, RatingController
    dto/             # NowPlayingDto, SessionDto, TrackRatingDto, SubmitRatingRequest
    entity/          # SpotifyToken, ListeningSession, TrackRating
    exception/       # GlobalExceptionHandler
    repository/      # SpotifyTokenRepository, SessionRepository, RatingRepository
    service/         # SpotifyService, SessionService, RatingService
  src/main/resources/
    db/migration/    # V1-V4 Flyway SQL migrations
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

## Commands

- Build backend: `./mvnw compile`
- Run backend: `./mvnw spring-boot:run`
- Run frontend: `cd on-wax-client && npm run dev`
- Build frontend: `cd on-wax-client && npx vite build`
