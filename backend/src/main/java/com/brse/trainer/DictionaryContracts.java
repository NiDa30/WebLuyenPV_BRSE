package com.brse.trainer;
import java.util.List;
public final class DictionaryContracts {
 private DictionaryContracts(){}
 public record Entry(String id,String term,String reading,List<String> senses,String source,String sourceUrl,String businessExample,String usageNote,String rights){}
 public record Capabilities(boolean kanjiScraping,boolean sentenceScraping,boolean externalMedia){}
 public record Lookup(String query,String state,List<Entry> entries,Capabilities capabilities){}
 public static String normalize(String input){
  if(input==null)throw new ApiFailure(400,"INVALID_LOOKUP_QUERY");
  String normalized=java.text.Normalizer.normalize(input,java.text.Normalizer.Form.NFC);String q=normalized.strip();
  if(q.isBlank()||q.codePointCount(0,q.length())>50||normalized.codePoints().anyMatch(c->{int t=Character.getType(c);return t==Character.CONTROL||t==Character.FORMAT||t==Character.SURROGATE||t==Character.LINE_SEPARATOR||t==Character.PARAGRAPH_SEPARATOR;}))throw new ApiFailure(400,"INVALID_LOOKUP_QUERY");
  return q;
 }
 public static String sourceUrl(String query){return "https://jisho.org/search/"+java.net.URLEncoder.encode(query,java.nio.charset.StandardCharsets.UTF_8).replace("+","%20");}
}
