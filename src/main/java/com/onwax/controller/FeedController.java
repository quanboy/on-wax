package com.onwax.controller;

import com.onwax.dto.FeedItemDto;
import com.onwax.entity.ListeningSession;
import com.onwax.entity.User;
import com.onwax.repository.SessionRepository;
import com.onwax.repository.UserRepository;
import com.onwax.service.FollowService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/feed")
public class FeedController {

    private final FollowService followService;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    public FeedController(FollowService followService, SessionRepository sessionRepository,
                          UserRepository userRepository) {
        this.followService = followService;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<FeedItemDto>> getFeed(@AuthenticationPrincipal String spotifyUserId) {
        List<Long> followedIds = followService.getFollowedUserIds(spotifyUserId);
        if (followedIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<ListeningSession> sessions = sessionRepository.findFeedSessions(
                followedIds, PageRequest.of(0, 50));

        List<Long> userIds = sessions.stream().map(ListeningSession::getUserId).distinct().toList();
        Map<Long, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<FeedItemDto> feed = sessions.stream().map(s -> {
            User u = usersById.get(s.getUserId());
            return new FeedItemDto(
                    s.getId(),
                    u != null ? u.getUsername() : null,
                    u != null ? u.getDisplayName() : null,
                    u != null ? u.getAvatarUrl() : null,
                    s.getSpotifyAlbumId(),
                    s.getAlbumName(),
                    s.getAlbumArtist(),
                    s.getAlbumArtUrl(),
                    s.getFinalScore(),
                    s.getCompletedAt()
            );
        }).toList();

        return ResponseEntity.ok(feed);
    }
}
