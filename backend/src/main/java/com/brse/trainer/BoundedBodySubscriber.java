package com.brse.trainer;

import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.util.List;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.Flow;

final class BoundedBodySubscriber implements HttpResponse.BodySubscriber<byte[]> {
    private final HttpResponse.BodySubscriber<byte[]> delegate=HttpResponse.BodySubscribers.ofByteArray();
    private Flow.Subscription subscription;
    private int received;
    public CompletionStage<byte[]> getBody(){return delegate.getBody();}
    public void onSubscribe(Flow.Subscription s){subscription=s;delegate.onSubscribe(s);}
    public void onNext(List<ByteBuffer> buffers){
        long length=buffers.stream().mapToLong(ByteBuffer::remaining).sum();
        if(length>131072-received){subscription.cancel();delegate.onError(new ApiFailure(502,"PROVIDER_RESPONSE_TOO_LARGE"));return;}
        received+=(int)length;delegate.onNext(buffers);
    }
    public void onError(Throwable error){delegate.onError(error);}
    public void onComplete(){delegate.onComplete();}
}
