package com.brse.trainer;
import com.sun.net.httpserver.HttpServer;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import java.net.*;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import static org.junit.jupiter.api.Assertions.*;
class JishoProviderTest {
 HttpServer server;ObjectMapper mapper=new ObjectMapper();int status=200;String type="application/json",request;String body="{\"meta\":{\"status\":200},\"data\":[{\"japanese\":[{\"word\":\"担当\",\"reading\":\"たんとう\"}],\"senses\":[{\"english_definitions\":[\"responsibility (synthetic fixture)\"]}],\"audio\":\"https://untrusted.example/a.mp3\"}]}";
 @BeforeEach void start()throws Exception{server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);server.createContext("/",e->{request=e.getRequestURI().toASCIIString();byte[] bytes=body.getBytes(StandardCharsets.UTF_8);e.getResponseHeaders().set("Content-Type",type);e.sendResponseHeaders(status,bytes.length);try(var out=e.getResponseBody()){out.write(bytes);}});server.start();}
 @AfterEach void stop(){server.stop(0);}
 JishoWordProvider provider(boolean enabled){return new JishoWordProvider(enabled,mapper,HttpClient.newHttpClient(),URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/words"),Duration.ofSeconds(2));}
 @Test void encodesPhraseMapsOnlyWordsAndNeverPropagatesMedia(){var entries=provider(true).lookup("担当");assertEquals("/words?keyword=%E6%8B%85%E5%BD%93",request);assertEquals("担当",entries.getFirst().term());assertEquals("たんとう",entries.getFirst().reading());assertEquals("JISHO_JSON",entries.getFirst().source());assertNull(entries.getFirst().businessExample());assertEquals("https://jisho.org/search/%E6%8B%85%E5%BD%93",entries.getFirst().sourceUrl());assertFalse(entries.toString().contains("untrusted.example"));}
 @Test void disabledOrInvalidQueriesMakeNoUpstreamRequest(){assertThrows(ApiFailure.class,()->provider(false).lookup("担当"));for(var q:new String[]{"","日".repeat(51),"line\nbreak","担当\n","\ud800"})assertThrows(ApiFailure.class,()->provider(true).lookup(q));assertNull(request);}
 @Test void normalizesNfcAndCountsUnicodeCodePoints(){provider(true).lookup("か\u3099");assertEquals("/words?keyword=%E3%81%8C",request);assertDoesNotThrow(()->DictionaryContracts.normalize("😀".repeat(50)));assertThrows(ApiFailure.class,()->DictionaryContracts.normalize("😀".repeat(51)));}
 @Test void handlesKanaOnlyAndEmptyData()throws Exception{body="{\"meta\":{\"status\":200},\"data\":[{\"japanese\":[{\"reading\":\"ありがとう\"}],\"senses\":[{\"english_definitions\":[\"thank you (fixture)\"]}]}]}";assertEquals("ありがとう",provider(true).lookup("ありがとう").getFirst().term());body="{\"meta\":{\"status\":200},\"data\":[]}";assertTrue(provider(true).lookup("none").isEmpty());}
 @Test void rateLimitAndServerFailuresHaveBoundedSafeErrors(){status=429;assertEquals(429,assertThrows(ApiFailure.class,()->provider(true).lookup("担当")).status);status=500;assertEquals(503,assertThrows(ApiFailure.class,()->provider(true).lookup("担当")).status);}
 @Test void malformedHtmlSchemaAndOversizeAreRejected(){for(var invalid:new String[]{"not json","{}","{\"meta\":{\"status\":200},\"data\":[{\"japanese\":[]}]}"}){body=invalid;assertThrows(ApiFailure.class,()->provider(true).lookup("担当"));}type="text/html";body="<script>bad</script>";assertThrows(ApiFailure.class,()->provider(true).lookup("担当"));type="application/json";body="x".repeat(131073);assertThrows(ApiFailure.class,()->provider(true).lookup("担当"));}
}
