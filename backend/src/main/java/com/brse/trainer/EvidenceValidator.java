package com.brse.trainer;

import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;
import static com.brse.trainer.Contracts.*;

@Component
public class EvidenceValidator {
    private String text(JsonNode n,String key,int max) {
        var v=n.get(key);
        if(v==null || !v.isTextual() || v.asText().isBlank() || v.asText().length()>max)throw new ApiFailure(502,"PROVIDER_SCHEMA_MISMATCH");
        return v.asText();
    }
    public FeedbackResult validate(JsonNode raw, String model,String version,List<Criterion> rubric,FeedbackRequest answer) {
        if(raw==null || !raw.isObject() || !raw.path("criteria").isArray() || raw.path("criteria").size()!=rubric.size())throw new ApiFailure(502,"PROVIDER_SCHEMA_MISMATCH");
        var results=new ArrayList<CriterionResult>();var seen=new HashSet<String>();
        for(var row:raw.path("criteria")) {
            var criterion=text(row,"criterionId",40);
            if(!seen.add(criterion)||rubric.stream().noneMatch(c->c.id().equals(criterion)))throw new ApiFailure(502,"PROVIDER_EVIDENCE_INVALID");
            var scoreNode=row.get("score");Integer score=null;
            if(scoreNode==null || (!scoreNode.isNull() && (!scoreNode.isIntegralNumber() || !scoreNode.canConvertToInt() || scoreNode.asInt()<0 || scoreNode.asInt()>3)))throw new ApiFailure(502,"PROVIDER_SCHEMA_MISMATCH");
            if(!scoreNode.isNull())score=scoreNode.asInt();
            var notes=row.path("annotations");
            if(!notes.isArray() || notes.size()>3 || (score!=null && notes.isEmpty()))throw new ApiFailure(502,"PROVIDER_EVIDENCE_INVALID");
            var evidence=new ArrayList<Evidence>();
            for(var note:notes) {
                var quote=text(note,"quote",10000);int offset=answer.text().indexOf(quote);
                if(offset<0)throw new ApiFailure(502,"PROVIDER_EVIDENCE_INVALID");
                evidence.add(new Evidence(UUID.randomUUID().toString(),criterion,answer.utteranceId(),answer.transcriptVersion(),quote,offset,offset+quote.length(),0,answer.endMs(),text(note,"reason",1500),text(note,"suggestion",1500),"MODEL_ASSESSMENT"));
            }
            results.add(new CriterionResult(criterion,score,List.copyOf(evidence)));
        }
        FollowUp followUp=null;var next=raw.get("followUp");
        if(next!=null && !next.isNull()) {
            var quote=text(next,"quote",10000);
            if(!answer.text().contains(quote))throw new ApiFailure(502,"PROVIDER_EVIDENCE_INVALID");
            followUp=new FollowUp(text(next,"question",500),quote,text(next,"reason",1000));
        }
        return new FeedbackResult("AI_MODEL","openai",model,version,answer.utteranceId(),answer.transcriptVersion(),List.copyOf(results),followUp,"Đánh giá do mô hình tạo, có thể sai. Không xác minh kinh nghiệm/CV; không chấm giọng nói, phát âm hoặc tính cách từ text.");
    }
}
