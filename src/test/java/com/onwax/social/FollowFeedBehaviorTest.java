package com.onwax.social;

import com.onwax.entity.ListeningSession;
import com.onwax.entity.User;
import com.onwax.repository.SessionRepository;
import com.onwax.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Behavior tests for the follow graph and the feed, against the real filter chain and a real
 * Postgres (Testcontainers). Authentication is simulated the same way as in
 * {@link com.onwax.security.SecurityAuthorizationTest}: by setting the {@code spotifyUserId}
 * session attribute that the bridge filter promotes. Each test uses its own users (unique
 * prefix) so tests stay independent despite the shared container.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class FollowFeedBehaviorTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private SessionRepository sessionRepository;

    private User createUser(String spotifyId, String username) {
        User u = new User();
        u.setSpotifyUserId(spotifyId);
        u.setUsername(username);
        u.setCreatedAt(LocalDateTime.now());
        return userRepository.save(u);
    }

    private ListeningSession createSession(User owner, String albumName, String status,
                                           BigDecimal finalScore, LocalDateTime completedAt) {
        ListeningSession s = new ListeningSession();
        s.setSpotifyUserId(owner.getSpotifyUserId());
        s.setUserId(owner.getId());
        s.setSpotifyAlbumId("album-" + albumName.hashCode());
        s.setAlbumName(albumName);
        s.setAlbumArtist("Test Artist");
        s.setTotalTracks(10);
        s.setStatus(status);
        s.setFinalScore(finalScore);
        s.setStartedAt(LocalDateTime.now().minusHours(1));
        s.setCompletedAt(completedAt);
        return sessionRepository.save(s);
    }

    private void follow(String followerSpotifyId, String targetUsername) throws Exception {
        mockMvc.perform(post("/users/{username}/follow", targetUsername)
                        .sessionAttr("spotifyUserId", followerSpotifyId).with(csrf()))
                .andExpect(status().isOk());
    }

    // --- Follow graph ---

    @Test
    void followAppearsInFollowGraphAndProfileCounts() throws Exception {
        User alice = createUser("fg-alice-spotify", "fg-alice");
        createUser("fg-bob-spotify", "fg-bob");

        follow(alice.getSpotifyUserId(), "fg-bob");

        mockMvc.perform(get("/users/fg-bob/followers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].username").value("fg-alice"));

        mockMvc.perform(get("/users/fg-alice/following"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].username").value("fg-bob"));

        // Counts on the profile, and isFollowing from the follower's point of view
        mockMvc.perform(get("/users/fg-bob").sessionAttr("spotifyUserId", alice.getSpotifyUserId()))
                .andExpect(jsonPath("$.followersCount").value(1))
                .andExpect(jsonPath("$.followingCount").value(0))
                .andExpect(jsonPath("$.isFollowing").value(true));
        mockMvc.perform(get("/users/fg-alice"))
                .andExpect(jsonPath("$.followersCount").value(0))
                .andExpect(jsonPath("$.followingCount").value(1));
    }

    @Test
    void followIsIdempotent() throws Exception {
        User alice = createUser("idem-alice-spotify", "idem-alice");
        createUser("idem-bob-spotify", "idem-bob");

        follow(alice.getSpotifyUserId(), "idem-bob");
        follow(alice.getSpotifyUserId(), "idem-bob");

        mockMvc.perform(get("/users/idem-bob/followers"))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void cannotFollowYourself() throws Exception {
        User solo = createUser("solo-spotify", "solo");

        mockMvc.perform(post("/users/solo/follow")
                        .sessionAttr("spotifyUserId", solo.getSpotifyUserId()).with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void followingUnknownUserIsBadRequest() throws Exception {
        User alice = createUser("ghost-alice-spotify", "ghost-alice");

        mockMvc.perform(post("/users/no-such-user/follow")
                        .sessionAttr("spotifyUserId", alice.getSpotifyUserId()).with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unfollowRemovesEdgeAndIsIdempotent() throws Exception {
        User alice = createUser("unf-alice-spotify", "unf-alice");
        createUser("unf-bob-spotify", "unf-bob");
        follow(alice.getSpotifyUserId(), "unf-bob");

        mockMvc.perform(delete("/users/unf-bob/follow")
                        .sessionAttr("spotifyUserId", alice.getSpotifyUserId()).with(csrf()))
                .andExpect(status().isOk());
        mockMvc.perform(get("/users/unf-bob/followers"))
                .andExpect(jsonPath("$.length()").value(0));

        // Unfollowing again is a no-op, not an error
        mockMvc.perform(delete("/users/unf-bob/follow")
                        .sessionAttr("spotifyUserId", alice.getSpotifyUserId()).with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void followListsArePublicAndOmitIsFollowingForAnonymousViewers() throws Exception {
        User alice = createUser("pub-alice-spotify", "pub-alice");
        createUser("pub-bob-spotify", "pub-bob");
        follow(alice.getSpotifyUserId(), "pub-bob");

        mockMvc.perform(get("/users/pub-bob/followers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("pub-alice"))
                .andExpect(jsonPath("$[0].isFollowing").isEmpty());
    }

    // --- Feed ---

    @Test
    void feedIsEmptyWhenFollowingNobody() throws Exception {
        User loner = createUser("feed-loner-spotify", "feed-loner");

        mockMvc.perform(get("/feed").sessionAttr("spotifyUserId", loner.getSpotifyUserId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void feedShowsCompletedSessionsOfFollowedUsersNewestFirst() throws Exception {
        User viewer = createUser("feed-viewer-spotify", "feed-viewer");
        User followed = createUser("feed-followed-spotify", "feed-followed");
        User stranger = createUser("feed-stranger-spotify", "feed-stranger");
        follow(viewer.getSpotifyUserId(), "feed-followed");

        LocalDateTime now = LocalDateTime.now();
        createSession(followed, "Older Album", "COMPLETED", new BigDecimal("7.50"), now.minusDays(1));
        createSession(followed, "Newer Album", "COMPLETED", new BigDecimal("9.25"), now);
        createSession(followed, "Unfinished Album", "IN_PROGRESS", null, null);
        createSession(stranger, "Stranger Album", "COMPLETED", new BigDecimal("5.00"), now);
        createSession(viewer, "My Own Album", "COMPLETED", new BigDecimal("8.00"), now);

        mockMvc.perform(get("/feed").sessionAttr("spotifyUserId", viewer.getSpotifyUserId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].albumName").value("Newer Album"))
                .andExpect(jsonPath("$[0].username").value("feed-followed"))
                .andExpect(jsonPath("$[0].finalScore").value(9.25))
                .andExpect(jsonPath("$[1].albumName").value("Older Album"));
    }
}
