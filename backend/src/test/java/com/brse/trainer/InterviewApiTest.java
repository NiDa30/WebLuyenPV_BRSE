package com.brse.trainer;

import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.test.web.servlet.MockMvc;
import java.util.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static com.brse.trainer.Contracts.*;

@SpringBootTest
@AutoConfigureMockMvc
class InterviewApiTest {
    @TestConfiguration static class Config {
        @Bean @Primary TestProvider testProvider(ObjectMapper mapper){return new TestProvider(mapper);}
    }
    static class TestProvider implements FeedbackProvider {
        boolean enabled=true;JsonNode result;final ObjectMapper mapper;int calls;
        TestProvider(ObjectMapper mapper){this.mapper=mapper;}
        public boolean available(){return enabled;}public String model(){return "fixture-model";}
        public JsonNode evaluate(String prompt,List<Criterion> rubric,FeedbackRequest answer){calls++;return result;}
    }
    @Autowired MockMvc mvc;@Autowired ObjectMapper mapper;@Autowired TestProvider provider;
    String text="私は画面の実装を担当しました。";UUID utterance=UUID.randomUUID();
    @BeforeEach void reset()throws Exception{provider.enabled=true;provider.calls=0;provider.result=valid("JOB");}
    @Test void technicalPromptsUseAuthoredCatalogAndExistingJobRubric()throws Exception {
        for(var id:List.of("tech-api-retry-v1","tech-sql-pagination-v1","tech-security-authz-v1","tech-vue-async-v1","tech-spring-transaction-v1","tech-postgres-plan-v1")){
            var session=create("JOB");
            mvc.perform(post("/api/v1/ai/interviews/"+session.path("id").asText()+"/feedback")
                .header("Authorization","Bearer "+session.path("capabilityToken").asText())
                .contentType("application/json").content(feedback(id)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.rubricVersion").value("job-text-v1"));
        }
    }
    JsonNode valid(String track)throws Exception {
        var criteria=new ArrayList<Object>();
        for(String id:track.equals("JOB")?List.of("intent","specificity","structure"):List.of("clarify","impact","actions"))
            criteria.add(Map.of("criterionId",id,"score",2,"annotations",List.of(Map.of("quote",text,"reason","Câu trả lời nêu vai trò theo thông tin tự khai.","suggestion","Nếu đúng trải nghiệm, bổ sung một kết quả có căn cứ."))));
        return mapper.valueToTree(Map.of("criteria",criteria,"followUp",Map.of("question","その作業の結果を教えてください。","quote",text,"reason","Làm rõ kết quả do người học đã đề cập vai trò.")));
    }
    JsonNode create(String track)throws Exception {
        var body=mapper.writeValueAsString(Map.of("track",track,"rubricVersion",track.equals("JOB")?"job-text-v1":"brse-text-v1","consent",true));
        return mapper.readTree(mvc.perform(post("/api/v1/ai/interviews").with(r->{r.setRemoteAddr(UUID.randomUUID().toString());return r;}).contentType("application/json").content(body)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }
    String feedback(String question)throws Exception{return mapper.writeValueAsString(Map.of("utteranceId",utterance,"transcriptVersion",1,"questionId",question,"mode","INITIAL","text",text,"endMs",30000));}
    @Test void authoredCsvScenarioUsesBrseRubricWithExactEvidence()throws Exception{
        provider.result=valid("BRSE");
        for(var question:List.of("scenario-csv-hearing-v1","scenario-csv-impact-v1","scenario-csv-agreement-v1")){
            var session=create("BRSE");
            mvc.perform(post("/api/v1/ai/interviews/"+session.path("id").asText()+"/feedback")
                .header("Authorization","Bearer "+session.path("capabilityToken").asText())
                .contentType("application/json").content(feedback(question)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.rubricVersion").value("brse-text-v1"))
                .andExpect(jsonPath("$.criteria[0].annotations[0].quote").value(text));
        }
        assertEquals(3,provider.calls);
    }
    @Test void authoredProductionScenarioUsesBrseRubricWithExactEvidence()throws Exception{
        provider.result=valid("BRSE");
        for(var question:List.of("scenario-incident-intake-v1","scenario-incident-update-v1","scenario-incident-plan-v1")){
            var session=create("BRSE");
            mvc.perform(post("/api/v1/ai/interviews/"+session.path("id").asText()+"/feedback")
                .header("Authorization","Bearer "+session.path("capabilityToken").asText())
                .contentType("application/json").content(feedback(question)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.rubricVersion").value("brse-text-v1"))
                .andExpect(jsonPath("$.criteria[0].annotations[0].quote").value(text));
        }
        assertEquals(3,provider.calls);
    }
    @Test void healthCapabilityAndDisabledProviderDoNotFakeResults()throws Exception{
        provider.enabled=false;
        mvc.perform(get("/api/v1/system/provider-capabilities")).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andExpect(jsonPath("$.aiFeedback.available").value(false)).andExpect(jsonPath("$.externalMedia.playAudio").value(false));
        mvc.perform(post("/api/v1/ai/interviews").contentType("application/json").content("{\"track\":\"JOB\",\"rubricVersion\":\"job-text-v1\",\"consent\":true}")).andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.code").value("AI_NOT_CONFIGURED"));
        assertEquals(0,provider.calls);
    }
    @Test void consentRubricUnknownFieldsAndInvalidJsonRejected()throws Exception{
        for(var body:List.of("{}","{\"track\":\"JOB\",\"rubricVersion\":\"job-text-v1\",\"consent\":false}","{\"track\":\"JOB\",\"rubricVersion\":\"old\",\"consent\":true}","{\"track\":\"JOB\",\"rubricVersion\":\"job-text-v1\",\"consent\":true,\"key\":\"not-accepted\"}","invalid"))
            mvc.perform(post("/api/v1/ai/interviews").contentType("application/json").content(body)).andExpect(status().isBadRequest());
        assertEquals(0,provider.calls);
    }
    @Test void successfulEvidenceStampedFromActualTranscriptAndSessionNotClientClaims()throws Exception{
        var s=create("JOB");var body=mvc.perform(post("/api/v1/ai/interviews/"+s.path("id").asText()+"/feedback").header("Authorization","Bearer "+s.path("capabilityToken").asText()).contentType("application/json").content(feedback("job-role-v1"))).andExpect(status().isOk()).andExpect(jsonPath("$.source").value("AI_MODEL")).andExpect(jsonPath("$.rubricVersion").value("job-text-v1")).andExpect(jsonPath("$.criteria[0].annotations[0].utteranceId").value(utterance.toString())).andExpect(jsonPath("$.criteria[0].annotations[0].startOffset").value(0)).andExpect(jsonPath("$.criteria[0].annotations[0].endMs").value(30000)).andReturn().getResponse().getContentAsString();
        assertFalse(body.contains(s.path("capabilityToken").asText()));assertFalse(body.contains("apiKey"));
    }
    @Test void invalidCapabilityAndTrackMismatchNeverCallProvider()throws Exception{
        var a=create("JOB");var b=create("BRSE");var url="/api/v1/ai/interviews/"+a.path("id").asText()+"/feedback";
        mvc.perform(post(url).header("Authorization","Bearer "+b.path("capabilityToken").asText()).contentType("application/json").content(feedback("job-role-v1"))).andExpect(status().isNotFound());
        mvc.perform(post(url).header("Authorization","Bearer "+a.path("capabilityToken").asText()).contentType("application/json").content(feedback("brse-scope-v1"))).andExpect(status().isBadRequest());
        assertEquals(0,provider.calls);
    }
    @Test void invalidModelQuotesOrScoresAreRejectedRatherThanDisplayed()throws Exception{
        var s=create("JOB");var url="/api/v1/ai/interviews/"+s.path("id").asText()+"/feedback";
        ((com.fasterxml.jackson.databind.node.ObjectNode)provider.result.path("criteria").path(0).path("annotations").path(0)).put("quote","fabricated");
        mvc.perform(post(url).header("Authorization","Bearer "+s.path("capabilityToken").asText()).contentType("application/json").content(feedback("job-role-v1"))).andExpect(status().isBadGateway()).andExpect(jsonPath("$.code").value("PROVIDER_EVIDENCE_INVALID"));
        provider.result=valid("JOB");((com.fasterxml.jackson.databind.node.ObjectNode)provider.result.path("criteria").path(0)).put("score",99);
        mvc.perform(post(url).header("Authorization","Bearer "+s.path("capabilityToken").asText()).contentType("application/json").content(feedback("job-role-v1"))).andExpect(status().isBadGateway());
    }
    @Test void missingOrDuplicateCriteriaAndUnanchoredFollowUpFailValidation()throws Exception{
        var validator=new EvidenceValidator();var a=new FeedbackRequest(utterance,1,"job-role-v1","INITIAL",text,30000);
        var rubric=List.of(new Criterion("intent","a",30),new Criterion("specificity","b",40),new Criterion("structure","c",30));
        var raw=valid("JOB");((com.fasterxml.jackson.databind.node.ObjectNode)raw.path("criteria").path(1)).put("criterionId","intent");
        assertThrows(ApiFailure.class,()->validator.validate(raw,"fixture","job-text-v1",rubric,a));
        var next=valid("JOB");((com.fasterxml.jackson.databind.node.ObjectNode)next.path("followUp")).put("quote","invented");
        assertThrows(ApiFailure.class,()->validator.validate(next,"fixture","job-text-v1",rubric,a));
    }
    @Test void nullScoreIsAllowedButNonNullScoreWithoutEvidenceIsNot()throws Exception{
        var validator=new EvidenceValidator();var a=new FeedbackRequest(utterance,1,"job-role-v1","INITIAL",text,30000);var rubric=List.of(new Criterion("intent","a",30),new Criterion("specificity","b",40),new Criterion("structure","c",30));
        var raw=valid("JOB");var first=(com.fasterxml.jackson.databind.node.ObjectNode)raw.path("criteria").path(0);first.putNull("score");first.putArray("annotations");
        assertNull(validator.validate(raw,"fixture","job-text-v1",rubric,a).criteria().getFirst().score());
        first.put("score",0);assertThrows(ApiFailure.class,()->validator.validate(raw,"fixture","job-text-v1",rubric,a));
    }
    @Test void deleteRequiresCapabilityAndRevokesAccess()throws Exception{
        var s=create("JOB");var url="/api/v1/ai/interviews/"+s.path("id").asText();
        mvc.perform(delete(url)).andExpect(status().isNotFound());
        mvc.perform(delete(url).header("Authorization","Bearer "+s.path("capabilityToken").asText())).andExpect(status().isNoContent());
        mvc.perform(post(url+"/feedback").header("Authorization","Bearer "+s.path("capabilityToken").asText()).contentType("application/json").content(feedback("job-role-v1"))).andExpect(status().isNotFound());
    }
    @Test void crossOriginAndOversizedRequestsAreRejected()throws Exception{
        mvc.perform(post("/api/v1/ai/interviews").header("Origin","https://attacker.example").contentType("application/json").content("{}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/ai/interviews").contentType("application/json").content("x".repeat(65537))).andExpect(status().isPayloadTooLarge());
        assertEquals(0,provider.calls);
    }
}
