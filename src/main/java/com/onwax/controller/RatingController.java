package com.onwax.controller;

import com.onwax.dto.SubmitRatingRequest;
import com.onwax.dto.TrackRatingDto;
import com.onwax.service.RatingService;
import com.onwax.service.SessionService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ratings")
public class RatingController {

    private final RatingService ratingService;
    private final SessionService sessionService;

    public RatingController(RatingService ratingService, SessionService sessionService) {
        this.ratingService = ratingService;
        this.sessionService = sessionService;
    }

    @PostMapping
    public ResponseEntity<TrackRatingDto> submitRating(@RequestBody SubmitRatingRequest request,
                                                       HttpSession session) {
        String spotifyUserId = (String) session.getAttribute("spotifyUserId");
        if (spotifyUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        TrackRatingDto rating = ratingService.submitRating(
                request.sessionId(),
                request.spotifyTrackId(),
                request.trackName(),
                request.trackNumber(),
                request.discNumber(),
                request.rating(),
                request.skipped(),
                request.note(),
                sessionService
        );

        return ResponseEntity.ok(rating);
    }
}
