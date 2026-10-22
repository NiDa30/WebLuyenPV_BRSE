package com.brse.trainer;

import org.junit.jupiter.api.Test;
import java.time.*;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static com.brse.trainer.Contracts.*;

class SessionRegistryTest {
    static class MutableClock extends Clock {
        Instant now=Instant.parse("2026-10-21T00:00:00Z");
        public Instant instant(){return now;}public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId zone){return this;}
    }
    private CreateSession request(){return new CreateSession("JOB","job-text-v1",true);}
    @Test void randomTokensCannotReadAnotherSessionAndDeleteRevokes() {
        var r=new SessionRegistry();var a=r.create(request(),"one");var b=r.create(request(),"two");
        assertNotEquals(a.capabilityToken(),b.capabilityToken());assertTrue(a.capabilityToken().length()>=43);
        assertThrows(ApiFailure.class,()->r.authorize(a.id(),"Bearer "+b.capabilityToken()));
        assertThrows(ApiFailure.class,()->r.authorize(a.id(),null));
        assertNotNull(r.authorize(a.id(),"Bearer "+a.capabilityToken()));
        r.delete(a.id(),"Bearer "+a.capabilityToken());assertThrows(ApiFailure.class,()->r.authorize(a.id(),"Bearer "+a.capabilityToken()));
    }
    @Test void expiryIsEnforcedAtDeadlineAndCreationBucketResets() {
        var clock=new MutableClock();var r=new SessionRegistry(clock);var a=r.create(request(),"one");
        clock.now=clock.now.plusSeconds(900);assertThrows(ApiFailure.class,()->r.authorize(a.id(),"Bearer "+a.capabilityToken()));
        for(int i=0;i<10;i++)r.create(request(),"same-ip");
        assertEquals(429,assertThrows(ApiFailure.class,()->r.create(request(),"same-ip")).status);
        clock.now=clock.now.plusSeconds(601);assertNotNull(r.create(request(),"same-ip"));
    }
    @Test void feedbackBudgetAndConcurrentCallsAreBounded() {
        var r=new SessionRegistry();var a=r.create(request(),"one");var s=r.authorize(a.id(),"Bearer "+a.capabilityToken());
        r.begin(s);assertEquals(429,assertThrows(ApiFailure.class,()->r.begin(s)).status);r.end(s);
        for(int i=0;i<4;i++){r.begin(s);r.end(s);}assertThrows(ApiFailure.class,()->r.begin(s));
    }
    @Test void unknownExpiredOrIncorrectTokenGetsSameError() {
        var r=new SessionRegistry();var a=r.create(request(),"one");
        assertEquals("SESSION_NOT_FOUND",assertThrows(ApiFailure.class,()->r.authorize(a.id(),"Bearer invalid")).code);
        assertEquals("SESSION_NOT_FOUND",assertThrows(ApiFailure.class,()->r.authorize(UUID.randomUUID(),"Bearer invalid")).code);
    }
}
