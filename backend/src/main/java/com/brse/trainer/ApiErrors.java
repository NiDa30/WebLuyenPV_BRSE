package com.brse.trainer;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import java.util.UUID;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(ApiFailure.class)
    public ResponseEntity<ProblemDetail> failure(ApiFailure e) { return problem(e.status,e.code); }
    @ExceptionHandler({MethodArgumentNotValidException.class,HttpMessageNotReadableException.class,
                       org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ProblemDetail> invalid(Exception e) { return problem(400,"INVALID_REQUEST"); }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> unexpected(Exception e) { return problem(500,"INTERNAL_ERROR"); }
    private ResponseEntity<ProblemDetail> problem(int status,String code) {
        var p=ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(status),code);
        p.setTitle("Request could not be completed");p.setProperty("code",code);p.setProperty("traceId",UUID.randomUUID().toString());
        var headers=new HttpHeaders();headers.setCacheControl("no-store");
        if(status==429)headers.set("Retry-After","60");
        return new ResponseEntity<>(p,headers,HttpStatusCode.valueOf(status));
    }
}
