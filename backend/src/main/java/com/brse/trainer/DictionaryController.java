package com.brse.trainer;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import static com.brse.trainer.DictionaryContracts.*;
@RestController
@RequestMapping("/api/v1/dictionary")
public class DictionaryController {
 private final DictionaryService service;
 public DictionaryController(DictionaryService service){this.service=service;}
 @GetMapping("/words")
 public Lookup words(@RequestParam(name="q",required=false)String q,HttpServletRequest request){
  if(!request.getParameterMap().keySet().equals(java.util.Set.of("q"))||request.getParameterValues("q").length!=1)throw new ApiFailure(400,"INVALID_LOOKUP_QUERY");
  return service.search(q,request.getRemoteAddr());
 }
}
