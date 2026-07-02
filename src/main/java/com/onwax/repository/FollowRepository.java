package com.onwax.repository;

import com.onwax.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    boolean existsByFollowerIdAndFollowedId(Long followerId, Long followedId);

    void deleteByFollowerIdAndFollowedId(Long followerId, Long followedId);

    List<Follow> findByFollowerId(Long followerId);

    List<Follow> findByFollowedId(Long followedId);

    long countByFollowerId(Long followerId);

    long countByFollowedId(Long followedId);
}
