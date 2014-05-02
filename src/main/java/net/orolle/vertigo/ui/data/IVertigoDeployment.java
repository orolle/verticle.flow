package net.orolle.vertigo.ui.data;

import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonObject;

public interface IVertigoDeployment {
  public void init();
  
  public void deploy(final Handler<JsonObject> startedHandler, final Handler<JsonObject> exceptionHandler);
  
  public void shutdown(final Handler<JsonObject> stoppededHandler, final Handler<JsonObject> exceptionHandler);
  
  public void remove(final Handler<JsonObject> stoppededHandler, final Handler<JsonObject> exceptionHandler);
}
