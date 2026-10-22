package com.brse.trainer;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.*;
import com.fasterxml.jackson.databind.*;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import java.nio.charset.StandardCharsets;
import static com.brse.trainer.DictionaryContracts.*;
@Component
public class JishoWordProvider implements DictionaryProvider {
 private final boolean enabled;private final HttpClient client;private final ObjectMapper mapper;private final URI endpoint;private final Duration timeout;
 @Autowired
 public JishoWordProvider(@Value("${brse.jisho.enabled:false}")boolean enabled,ObjectMapper mapper){this(enabled,mapper,productionClient(),URI.create("https://jisho.org/api/v1/search/words"),Duration.ofSeconds(12));}
 JishoWordProvider(boolean enabled,ObjectMapper mapper,HttpClient client,URI endpoint,Duration timeout){this.enabled=enabled;this.mapper=mapper;this.client=client;this.endpoint=endpoint;this.timeout=timeout;}
 private static HttpClient productionClient(){
  var builder=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER);var proxy=System.getenv("HTTPS_PROXY");
  if(proxy!=null&&!proxy.isBlank()){var uri=URI.create(proxy);if(uri.getHost()==null||uri.getUserInfo()!=null)throw new IllegalStateException("Unsupported proxy configuration");builder.proxy(ProxySelector.of(new InetSocketAddress(uri.getHost(),uri.getPort()>0?uri.getPort():80)));}
  return builder.build();
 }
 public boolean enabled(){return enabled;}
 public List<Entry> lookup(String input){
  var q=normalize(input);if(!enabled)throw new ApiFailure(503,"DICTIONARY_DISABLED");
  var request=HttpRequest.newBuilder(URI.create(endpoint+"?keyword="+URLEncoder.encode(q,StandardCharsets.UTF_8))).timeout(timeout).header("Accept","application/json").GET().build();
  var pending=client.sendAsync(request,info->new BoundedBodySubscriber());
  try{
   var response=pending.get(timeout.toMillis(),java.util.concurrent.TimeUnit.MILLISECONDS);
   if(response.statusCode()==429)throw new ApiFailure(429,"DICTIONARY_RATE_LIMITED");
   if(response.statusCode()!=200)throw new ApiFailure(503,"DICTIONARY_UNAVAILABLE");
   if(!response.headers().firstValue("Content-Type").orElse("").toLowerCase(Locale.ROOT).startsWith("application/json"))throw new ApiFailure(502,"DICTIONARY_SCHEMA_MISMATCH");
   var raw=mapper.readTree(response.body());
   return normalizeResponse(raw,q);
  }catch(ApiFailure e){throw e;}
  catch(java.util.concurrent.TimeoutException e){pending.cancel(true);throw new ApiFailure(503,"DICTIONARY_UNAVAILABLE");}
  catch(InterruptedException e){pending.cancel(true);Thread.currentThread().interrupt();throw new ApiFailure(503,"DICTIONARY_UNAVAILABLE");}
  catch(java.util.concurrent.ExecutionException e){throw new ApiFailure(503,"DICTIONARY_UNAVAILABLE");}
  catch(java.io.IOException e){throw new ApiFailure(502,"DICTIONARY_SCHEMA_MISMATCH");}
 }
 List<Entry> normalizeResponse(JsonNode raw,String query){
  if(raw==null||!raw.path("meta").path("status").isInt()||raw.path("meta").path("status").asInt()!=200||!raw.path("data").isArray())throw new ApiFailure(502,"DICTIONARY_SCHEMA_MISMATCH");
  var entries=new ArrayList<Entry>();
  for(var row:raw.path("data")){
   if(entries.size()>=10)break;
   var japanese=row.path("japanese");var senses=row.path("senses");
   if(!japanese.isArray()||japanese.isEmpty()||!senses.isArray()||senses.isEmpty())throw new ApiFailure(502,"DICTIONARY_SCHEMA_MISMATCH");
   var first=japanese.get(0);String reading=optionalText(first.get("reading"),200);String word=optionalText(first.get("word"),200);if(word==null)word=reading;
   if(word==null)throw new ApiFailure(502,"DICTIONARY_SCHEMA_MISMATCH");
   var definitions=new ArrayList<String>();
   for(var sense:senses){var defs=sense.path("english_definitions");if(!defs.isArray()||defs.isEmpty())throw new ApiFailure(502,"DICTIONARY_SCHEMA_MISMATCH");for(var def:defs){var value=optionalText(def,1500);if(value==null)throw new ApiFailure(502,"DICTIONARY_SCHEMA_MISMATCH");if(definitions.size()<5)definitions.add(value);}}
   entries.add(new Entry("jisho-"+entries.size(),word,reading,List.copyOf(definitions),"JISHO_JSON",sourceUrl(query),null,null,"EXTERNAL_LOOKUP_NO_CACHE"));
  }
  return List.copyOf(entries);
 }
 private String optionalText(JsonNode value,int limit){if(value==null||value.isNull())return null;if(!value.isTextual()||value.asText().isBlank()||value.asText().length()>limit)throw new ApiFailure(502,"DICTIONARY_SCHEMA_MISMATCH");return value.asText();}
}
