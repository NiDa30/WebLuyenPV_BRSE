package com.brse.trainer;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.io.IOException;
import static com.brse.trainer.DictionaryContracts.*;
@Component
public class AuthoredDictionary {
 private final List<Entry> entries;
 public AuthoredDictionary(ObjectMapper mapper)throws IOException{
  try(var stream=AuthoredDictionary.class.getResourceAsStream("/business-japanese.json")){
   var raw=mapper.readTree(stream);var list=new ArrayList<Entry>();
   for(var e:raw){var senses=new ArrayList<String>();e.path("senses").forEach(s->senses.add(s.asText()));list.add(new Entry(e.path("id").asText(),e.path("term").asText(),e.path("reading").asText(),List.copyOf(senses),"AUTHOR_CREATED",null,e.path("businessExample").asText(),e.path("usageNote").asText(),"FIRST_PARTY"));}
   entries=List.copyOf(list);
  }
 }
 public List<Entry> lookup(String query){var q=query.toLowerCase(Locale.ROOT);return entries.stream().filter(e->e.term().toLowerCase(Locale.ROOT).contains(q)||e.reading().contains(q)||e.senses().stream().anyMatch(s->s.toLowerCase(Locale.ROOT).contains(q))).limit(10).toList();}
}
