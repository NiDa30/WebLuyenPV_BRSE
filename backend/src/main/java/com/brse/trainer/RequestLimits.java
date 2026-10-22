package com.brse.trainer;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.*;

@Component
public class RequestLimits extends OncePerRequestFilter {
    private static final int LIMIT=65536;
    private final String allowedOrigin;
    public RequestLimits(@org.springframework.beans.factory.annotation.Value("${brse.api.allowed-origin:}")String allowedOrigin){this.allowedOrigin=allowedOrigin;}
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        response.setHeader("Cache-Control","no-store");response.setHeader("X-Content-Type-Options","nosniff");
        if(!request.getRequestURI().startsWith("/api/")){chain.doFilter(request,response);return;}
        var origin=request.getHeader("Origin");
        // Same-origin deployment only. No permissive CORS or client-supplied forwarding headers.
        if(origin!=null && !origin.equals(allowedOrigin) && !origin.equals(request.getScheme()+"://"+request.getServerName()+(request.getServerPort()==80||request.getServerPort()==443?"":":"+request.getServerPort()))) {
            reject(response,403,"ORIGIN_DENIED");return;
        }
        if(request.getContentLengthLong()>LIMIT){reject(response,413,"PAYLOAD_TOO_LARGE");return;}
        if("POST".equals(request.getMethod())) {
            var bytes=request.getInputStream().readNBytes(LIMIT+1);
            if(bytes.length>LIMIT){reject(response,413,"PAYLOAD_TOO_LARGE");return;}
            var wrapped=new HttpServletRequestWrapper(request) {
                @Override public ServletInputStream getInputStream() {
                    var input=new ByteArrayInputStream(bytes);
                    return new ServletInputStream(){public int read(){return input.read();}public boolean isFinished(){return input.available()==0;}public boolean isReady(){return true;}public void setReadListener(ReadListener listener){throw new UnsupportedOperationException();}};
                }
            };
            chain.doFilter(wrapped,response);return;
        }
        chain.doFilter(request,response);
    }
    private void reject(HttpServletResponse r,int status,String code)throws IOException {
        r.setStatus(status);r.setContentType("application/problem+json");r.getWriter().write("{\"status\":"+status+",\"title\":\"Request rejected\",\"code\":\""+code+"\"}");
    }
}
