package com.onwax.service;

import com.onwax.entity.Follow;
import com.onwax.entity.User;
import com.onwax.repository.FollowRepository;
import com.onwax.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    public FollowService(FollowRepository followRepository, UserRepository userRepository) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void follow(String followerSpotifyId, String targetUsername) {
        User follower = getBySpotifyId(followerSpotifyId);
        User target = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUsername));
        if (target.getId().equals(follower.getId())) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }
        if (followRepository.existsByFollowerIdAndFollowedId(follower.getId(), target.getId())) {
            return;
        }
        Follow follow = new Follow();
        follow.setFollowerId(follower.getId());
        follow.setFollowedId(target.getId());
        follow.setFollowedAt(LocalDateTime.now());
        followRepository.save(follow);
    }

    @Transactional
    public void unfollow(String followerSpotifyId, String targetUsername) {
        User follower = getBySpotifyId(followerSpotifyId);
        User target = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUsername));
        followRepository.deleteByFollowerIdAndFollowedId(follower.getId(), target.getId());
    }

    public List<User> getFollowers(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        List<Long> followerIds = followRepository.findByFollowedId(user.getId())
                .stream().map(Follow::getFollowerId).toList();
        return userRepository.findAllById(followerIds);
    }

    public List<User> getFollowing(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        List<Long> followedIds = followRepository.findByFollowerId(user.getId())
                .stream().map(Follow::getFollowedId).toList();
        return userRepository.findAllById(followedIds);
    }

    public List<Long> getFollowedUserIds(String spotifyUserId) {
        User user = getBySpotifyId(spotifyUserId);
        return followRepository.findByFollowerId(user.getId())
                .stream().map(Follow::getFollowedId).toList();
    }

    private User getBySpotifyId(String spotifyUserId) {
        return userRepository.findBySpotifyUserId(spotifyUserId)
                .orElseThrow(() -> new IllegalStateException("No user for spotifyUserId: " + spotifyUserId));
    }
}
