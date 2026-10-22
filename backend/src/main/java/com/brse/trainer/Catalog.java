package com.brse.trainer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.List;
import static com.brse.trainer.Contracts.*;

@Component
public class Catalog {
    private final JsonNode data;
    public Catalog(ObjectMapper mapper) throws IOException {
        try (var stream = Catalog.class.getResourceAsStream("/interview-catalog.json")) { data=mapper.readTree(stream); }
    }
    public String version(String track) {
        var rubric=data.path("rubrics").path(track);
        if(rubric.isMissingNode()) throw new ApiFailure(400,"INVALID_TRACK");
        return rubric.path("version").asText();
    }
    public List<Criterion> criteria(String track) {
        return java.util.stream.StreamSupport.stream(data.path("rubrics").path(track).path("criteria").spliterator(),false)
            .map(c->new Criterion(c.path("id").asText(),c.path("name").asText(),c.path("weight").asInt())).toList();
    }
    public String prompt(String id,String track,String mode) {
        for(var q:data.path("questions")) if(q.path("id").asText().equals(id) && q.path("track").asText().equals(track))
            return q.path(mode.equals("INDEPENDENT")?"variant":"japanese").asText();
        throw new ApiFailure(400,"QUESTION_TRACK_MISMATCH");
    }
}
