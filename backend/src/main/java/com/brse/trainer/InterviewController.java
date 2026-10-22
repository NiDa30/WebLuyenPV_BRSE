package com.brse.trainer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import static com.brse.trainer.Contracts.*;

@RestController
@RequestMapping("/api/v1")
public class InterviewController {
    private final java.util.concurrent.Semaphore providerSlots=new java.util.concurrent.Semaphore(4);
    private final SessionRegistry sessions;private final Catalog catalog;private final FeedbackProvider provider;private final EvidenceValidator validator;
    public InterviewController(SessionRegistry sessions,Catalog catalog,FeedbackProvider provider,EvidenceValidator validator) {this.sessions=sessions;this.catalog=catalog;this.provider=provider;this.validator=validator;}
    @GetMapping("/system/provider-capabilities")
    public Map<String,Object> capabilities() {
        return Map.of("aiFeedback",Map.of("available",provider.available(),"state",provider.available()?"AVAILABLE":"NOT_CONFIGURED","provider","openai","model",provider.available()?provider.model():"","retentionSeconds",900),"externalMedia",Map.of("showText",false,"playAudio",false,"embedImage",false,"cache",false));
    }
    @PostMapping("/ai/interviews")
    public ResponseEntity<SessionCreated> create(@Valid @RequestBody CreateSession body,HttpServletRequest request) {
        if(!catalog.version(body.track()).equals(body.rubricVersion()))throw new ApiFailure(400,"RUBRIC_VERSION_MISMATCH");
        if(!provider.available())throw new ApiFailure(503,"AI_NOT_CONFIGURED");
        return ResponseEntity.status(201).body(sessions.create(body,request.getRemoteAddr()));
    }
    @PostMapping("/ai/interviews/{id}/feedback")
    public FeedbackResult feedback(@PathVariable UUID id,@RequestHeader(value="Authorization",required=false)String auth,@Valid @RequestBody FeedbackRequest body) {
        var session=sessions.authorize(id,auth);
        var prompt=catalog.prompt(body.questionId(),session.track,body.mode());
        if(!provider.available())throw new ApiFailure(503,"AI_NOT_CONFIGURED");
        if(!providerSlots.tryAcquire())throw new ApiFailure(503,"SERVER_BUSY");
        try {sessions.begin(session);}catch(RuntimeException e){providerSlots.release();throw e;}
        try {return validator.validate(provider.evaluate(prompt,catalog.criteria(session.track),body),provider.model(),session.rubric,catalog.criteria(session.track),body);}
        finally {sessions.end(session);providerSlots.release();}
    }
    @DeleteMapping("/ai/interviews/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,@RequestHeader(value="Authorization",required=false)String auth) {sessions.delete(id,auth);return ResponseEntity.noContent().build();}
}
