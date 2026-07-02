package com.onwax.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Bridges the existing Spotify-OAuth session into Spring Security. The OAuth callback stores
 * the Spotify user id under the {@code spotifyUserId} session attribute; this filter promotes
 * that into a {@link SecurityContextHolder} authentication (principal = the Spotify user id),
 * so {@code authorizeHttpRequests} rules and {@code @AuthenticationPrincipal} work without
 * rewriting the login flow.
 */
public class SpotifySessionAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            HttpSession session = request.getSession(false);
            if (session != null && session.getAttribute("spotifyUserId") instanceof String uid
                    && !uid.isBlank()) {
                var auth = new PreAuthenticatedAuthenticationToken(
                        uid, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        filterChain.doFilter(request, response);
    }
}
