package net.orolle.vertigo.ui.util;

import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.Future;
import org.vertx.java.core.Handler;

public class FutureAdapter<T> implements Future<T> {
  private T result = null;
  private Throwable error = null;
  private Handler<AsyncResult<T>> handler;
  
  @Override
  public T result() {
    return result;
  }

  @Override
  public Throwable cause() {
    return error;
  }

  @Override
  public boolean succeeded() {
    return result != null;
  }

  @Override
  public boolean failed() {
    return error != null;
  }

  @Override
  public boolean complete() {
    return result != null || error != null;
  }

  @Override
  public Future<T> setHandler(Handler<AsyncResult<T>> handler) {
    this.handler = handler;
    return this;
  }

  @Override
  public Future<T> setResult(T result) {
    this.result = result;
    
    if(handler != null)
      handler.handle(this);
    
    return this;
  }

  @Override
  public Future<T> setFailure(Throwable throwable) {
    this.error = throwable;
    
    if(handler != null)
      handler.handle(this);
    return this;
  }

}
