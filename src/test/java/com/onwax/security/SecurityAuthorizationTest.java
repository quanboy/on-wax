package com.onwax.security;

import com.onwax.entity.User;
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

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the Spring Security authorization rules (public-profiles model) and CSRF enforcement
 * against the real filter chain. Authentication is simulated by setting the {@code spotifyUserId}
 * session attribute the same way the OAuth callback does, which the bridge filter promotes.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class SecurityAuthorizationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;

    private void ensureUser(String spotifyId, String username) {
        if (userRepository.findBySpotifyUserId(spotifyId).isEmpty()) {
            User u = new User();
            u.setSpotifyUserId(spotifyId);
            u.setUsername(username);
            u.setCreatedAt(LocalDateTime.now());
            userRepository.save(u);
        }
    }

    @Test
    void feedRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/feed")).andExpect(status().isUnauthorized());
    }

    @Test
    void publicProfileReadableWithoutAuth() throws Exception {
        ensureUser("pub-spotify", "publicuser");
        mockMvc.perform(get("/users/publicuser")).andExpect(status().isOk());
    }

    @Test
    void feedAccessibleWhenAuthenticated() throws Exception {
        ensureUser("viewer-spotify", "viewer");
        mockMvc.perform(get("/feed").sessionAttr("spotifyUserId", "viewer-spotify"))
                .andExpect(status().isOk());
    }

    @Test
    void mutationWithoutCsrfTokenIsForbidden() throws Exception {
        ensureUser("actor-spotify", "actor");
        mockMvc.perform(post("/users/ghost/follow").sessionAttr("spotifyUserId", "actor-spotify"))
                .andExpect(status().isForbidden());
    }
}
