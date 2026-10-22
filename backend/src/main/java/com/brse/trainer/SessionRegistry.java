package com.brse.trainer;

import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import static com.brse.trainer.Contracts.*;

@Component
public class SessionRegistry {
    static final Duration TTL=Duration.ofMinutes(15);
    private final Clock clock;
    private final SecureRandom random=new SecureRandom();
    private final Map<UUID,Session> sessions=new HashMap<>();
    private final Map<String,Bucket> creations=new HashMap<>();
    private final byte[] salt=new byte[32];
    public SessionRegistry() { this(Clock.systemUTC()); }
    SessionRegistry(Clock clock) { this.clock=clock;random.nextBytes(salt); }
    static final class Session {
        final UUID id;final byte[] hash;final String track,rubric;final Instant expires;int calls;boolean busy;
        Session(UUID id,byte[] hash,String track,String rubric,Instant expires) {this.id=id;this.hash=hash;this.track=track;this.rubric=rubric;this.expires=expires;}
    }
    record Bucket(Instant reset,int used) {}
    private byte[] digest(String value) {
        try { var d=MessageDigest.getInstance("SHA-256");d.update(salt);return d.digest(value.getBytes(StandardCharsets.UTF_8)); }
        catch(NoSuchAlgorithmException e) { throw new IllegalStateException(); }
    }
    private void purge() {
        var now=clock.instant();sessions.values().removeIf(s->!s.expires.isAfter(now));creations.values().removeIf(b->!b.reset.isAfter(now));
    }
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay=60000)
    public synchronized void cleanup() {purge();}
    public synchronized SessionCreated create(CreateSession request,String ip) {
        purge();var key=Base64.getEncoder().encodeToString(digest(ip));var now=clock.instant();
        var bucket=creations.getOrDefault(key,new Bucket(now.plus(Duration.ofMinutes(10)),0));
        if(bucket.used>=10 || sessions.size()>=1000 || creations.size()>=10000)throw new ApiFailure(429,"SESSION_LIMIT");
        creations.put(key,new Bucket(bucket.reset,bucket.used+1));
        byte[] bytes=new byte[32];random.nextBytes(bytes);var token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        var s=new Session(UUID.randomUUID(),digest(token),request.track(),request.rubricVersion(),now.plus(TTL));sessions.put(s.id,s);
        return new SessionCreated(s.id,token,s.expires);
    }
    public synchronized Session authorize(UUID id,String auth) {
        purge();var s=sessions.get(id);
        if(auth==null || !auth.startsWith("Bearer ") || auth.length()>100 || s==null || !MessageDigest.isEqual(s.hash,digest(auth.substring(7))))throw new ApiFailure(404,"SESSION_NOT_FOUND");
        return s;
    }
    public synchronized void begin(Session s) {
        if(!s.expires.isAfter(clock.instant()))throw new ApiFailure(404,"SESSION_NOT_FOUND");
        if(s.busy || s.calls>=5)throw new ApiFailure(429,"FEEDBACK_LIMIT");
        s.calls++;s.busy=true;
    }
    public synchronized void end(Session s) {s.busy=false;}
    public synchronized void delete(UUID id,String auth) {authorize(id,auth);sessions.remove(id);}
}
