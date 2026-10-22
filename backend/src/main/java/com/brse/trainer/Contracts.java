package com.brse.trainer;

import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class Contracts {
    private Contracts() {}
    public record CreateSession(@NotBlank @Pattern(regexp="JOB|BRSE") String track,
                                @NotBlank @Size(max=40) String rubricVersion, @AssertTrue boolean consent) {}
    public record SessionCreated(UUID id, String capabilityToken, Instant expiresAt) {}
    public record FeedbackRequest(@NotNull UUID utteranceId, @Min(1) @Max(30) int transcriptVersion,
                                  @NotBlank @Size(max=50) String questionId,
                                  @NotBlank @Pattern(regexp="INITIAL|GUIDED|INDEPENDENT") String mode,
                                  @NotBlank @Size(max=10000) String text, @Min(0) @Max(604800000) long endMs) {}
    public record Criterion(String id, String name, int weight) {}
    public record CatalogQuestion(String id, String track, String japanese, String variant) {}
    public record Evidence(String id, String criterionId, UUID utteranceId, int transcriptVersion,
                           String quote, int startOffset, int endOffset, long startMs, long endMs,
                           String reason, String suggestion, String certainty) {}
    public record CriterionResult(String criterionId, Integer score, List<Evidence> annotations) {}
    public record FollowUp(String question, String quote, String reason) {}
    public record FeedbackResult(String source, String provider, String model, String rubricVersion,
                                 UUID utteranceId, int transcriptVersion, List<CriterionResult> criteria,
                                 FollowUp followUp, String limitation) {}
}
