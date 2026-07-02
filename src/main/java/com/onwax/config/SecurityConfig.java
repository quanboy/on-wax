package com.onwax.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
                // OAuth redirects are top-level GET navigations, not state-changing XHR.
                .ignoringRequestMatchers("/spotify/**"))
            .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
            // Must run before AnonymousAuthenticationFilter, or it would skip on the anonymous token.
            .addFilterBefore(new SpotifySessionAuthFilter(), AnonymousAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                // Public: OAuth + health
                .requestMatchers("/spotify/login", "/spotify/callback", "/spotify/logout").permitAll()
                .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                // Own profile must be matched before the public /users/* wildcard
                .requestMatchers(HttpMethod.GET, "/users/me", "/users/me/badges").authenticated()
                // Public profiles (Letterboxd-style): anyone can view profiles, badges, graph
                .requestMatchers(HttpMethod.GET, "/users/*", "/users/*/badges",
                        "/users/*/followers", "/users/*/following").permitAll()
                // Everything else (feed, sessions, ratings, follow/unfollow, PATCH /me, now-playing)
                .anyRequest().authenticated())
            .exceptionHandling(eh -> eh.authenticationEntryPoint(
                (req, res, ex) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .logout(logout -> logout.disable());
        return http.build();
    }
}
