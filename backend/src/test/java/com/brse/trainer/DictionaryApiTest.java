package com.brse.trainer;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.*;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.context.annotation.*;
import org.springframework.test.web.servlet.MockMvc;
import java.util.*;
import static com.brse.trainer.DictionaryContracts.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest
@AutoConfigureMockMvc
class DictionaryApiTest {
 @TestConfiguration static class Config {@Bean @Primary FixtureDictionary fixtureDictionary(){return new FixtureDictionary();}}
 static class FixtureDictionary implements DictionaryProvider {boolean enabled=true;int calls;ApiFailure failure;List<Entry> entries=List.of();public boolean enabled(){return enabled;}public List<Entry> lookup(String query){calls++;if(failure!=null)throw failure;return entries;}}
 @Autowired MockMvc mvc;@Autowired FixtureDictionary provider;@Autowired AuthoredDictionary authored;
 @BeforeEach void reset(){provider.enabled=true;provider.calls=0;provider.failure=null;provider.entries=List.of();}
 @Test void disabledUsesAuthoredFallbackWithoutCallingProvider()throws Exception{provider.enabled=false;mvc.perform(get("/api/v1/dictionary/words").param("q","担当")).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andExpect(jsonPath("$.state").value("PROVIDER_DISABLED")).andExpect(jsonPath("$.entries[0].source").value("AUTHOR_CREATED")).andExpect(jsonPath("$.capabilities.externalMedia").value(false));assertEquals(0,provider.calls);}
 @Test void validatesOnlyOneShortQueryNoPrivateContextParams()throws Exception{for(var q:new String[]{"","日".repeat(51),"line\nbreak","\ud800"})mvc.perform(get("/api/v1/dictionary/words").param("q",q)).andExpect(status().isBadRequest());mvc.perform(get("/api/v1/dictionary/words")).andExpect(status().isBadRequest());mvc.perform(get("/api/v1/dictionary/words").param("q","担当","要件")).andExpect(status().isBadRequest());mvc.perform(get("/api/v1/dictionary/words").param("q","担当").param("transcript","private")).andExpect(status().isBadRequest());assertEquals(0,provider.calls);}
 @Test void validJishoResultIsLabeledAndNoScrapingOrMediaEnabled()throws Exception{provider.entries=List.of(new Entry("jisho-0","担当","たんとう",List.of("synthetic fixture sense"),"JISHO_JSON",sourceUrl("担当"),null,null,"EXTERNAL_LOOKUP_NO_CACHE"));mvc.perform(get("/api/v1/dictionary/words").param("q","担当")).andExpect(status().isOk()).andExpect(jsonPath("$.state").value("RESULTS")).andExpect(jsonPath("$.entries[0].source").value("JISHO_JSON")).andExpect(jsonPath("$.capabilities.kanjiScraping").value(false)).andExpect(jsonPath("$.capabilities.sentenceScraping").value(false));}
 @Test void providerErrorSchemaAndNoResultsAreDistinctAndFallbackIsAuthored()throws Exception{for(var state:Map.of(503,"PROVIDER_UNAVAILABLE",502,"SCHEMA_MISMATCH",429,"RATE_LIMITED").entrySet()){provider.failure=new ApiFailure(state.getKey(),"test");mvc.perform(get("/api/v1/dictionary/words").param("q","担当")).andExpect(status().isOk()).andExpect(jsonPath("$.state").value(state.getValue())).andExpect(jsonPath("$.entries[0].source").value("AUTHOR_CREATED"));}provider.failure=null;mvc.perform(get("/api/v1/dictionary/words").param("q","no-matching-fixture")).andExpect(status().isOk()).andExpect(jsonPath("$.state").value("NO_RESULTS")).andExpect(jsonPath("$.entries").isEmpty());}
 @Test void outgoingRateBudgetIsPerPeerAndDoesNotDisableAuthoredFallback(){var p=new FixtureDictionary();var service=new DictionaryService(p,authored);for(int i=0;i<20;i++)assertEquals("NO_RESULTS",service.search("担当","synthetic-peer").state());assertEquals("RATE_LIMITED",service.search("担当","synthetic-peer").state());assertEquals(20,p.calls);assertEquals("NO_RESULTS",service.search("担当","another-peer").state());}
 @Test void invalidQueryFailsBeforeProviderAndAuthoredCorpusWorksWithNfc(){var p=new FixtureDictionary();var service=new DictionaryService(p,authored);assertThrows(ApiFailure.class,()->service.search("日".repeat(51),"peer"));assertEquals(0,p.calls);assertEquals("担当",authored.lookup("担当").getFirst().term());assertTrue(authored.lookup("missing").isEmpty());}
}
