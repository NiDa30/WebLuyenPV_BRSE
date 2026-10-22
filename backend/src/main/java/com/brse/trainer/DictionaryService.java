package com.brse.trainer;
import org.springframework.stereotype.Service;
import java.time.*;
import java.security.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static com.brse.trainer.DictionaryContracts.*;
@Service
public class DictionaryService {
 private final DictionaryProvider provider;private final AuthoredDictionary authored;private final java.util.concurrent.Semaphore slots=new java.util.concurrent.Semaphore(4);
 private final Map<String,Bucket> rates=new HashMap<>();private final byte[] salt=new byte[32];
 record Bucket(Instant expires,int count){}
 public DictionaryService(DictionaryProvider provider,AuthoredDictionary authored){this.provider=provider;this.authored=authored;new SecureRandom().nextBytes(salt);}
 private synchronized boolean limited(String ip){
  var now=Instant.now();rates.values().removeIf(b->!b.expires.isAfter(now));
  String key;try{var digest=MessageDigest.getInstance("SHA-256");digest.update(salt);key=Base64.getEncoder().encodeToString(digest.digest(ip.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException();}
  var b=rates.get(key);if(b==null){if(rates.size()>=10000)return true;b=new Bucket(now.plusSeconds(60),0);}if(b.count>=20)return true;rates.put(key,new Bucket(b.expires,b.count+1));return false;
 }
 public Lookup search(String input,String ip){
  var q=normalize(input);
  if(!provider.enabled())return fallback(q,"PROVIDER_DISABLED");
  if(limited(ip)||!slots.tryAcquire())return fallback(q,"RATE_LIMITED");
  try{var entries=provider.lookup(q);return new Lookup(q,entries.isEmpty()?"NO_RESULTS":"RESULTS",entries.isEmpty()?authored.lookup(q):entries,new Capabilities(false,false,false));}
  catch(ApiFailure e){return fallback(q,e.status==429?"RATE_LIMITED":e.status==502?"SCHEMA_MISMATCH":"PROVIDER_UNAVAILABLE");}
  finally{slots.release();}
 }
 private Lookup fallback(String q,String state){return new Lookup(q,state,authored.lookup(q),new Capabilities(false,false,false));}
}
