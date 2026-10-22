package com.brse.trainer;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import static com.brse.trainer.Contracts.*;

public interface FeedbackProvider {
    boolean available();
    String model();
    JsonNode evaluate(String prompt, List<Criterion> rubric, FeedbackRequest answer);
}
