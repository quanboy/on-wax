package com.onwax.controller;

import com.onwax.dto.SubmitRatingRequest;
import com.onwax.dto.TrackRatingDto;
import com.onwax.service.RatingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ratings")
public class RatingController {

    private final RatingService ratingService;

    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @PostMapping
    public ResponseEntity<TrackRatingDto> submitRating(@Valid @RequestBody SubmitRatingRequest request,
                                                       @AuthenticationPrincipal String spotifyUserId) {
        TrackRatingDto rating = ratingService.submitRating(
                spotifyUserId,
                request.sessionId(),
                request.spotifyTrackId(),
                request.trackName(),
                request.trackNumber(),
                request.discNumber(),
                request.rating(),
                request.skipped(),
                request.autoSkipped(),
                request.note()
        );

        return ResponseEntity.ok(rating);
    }
}
