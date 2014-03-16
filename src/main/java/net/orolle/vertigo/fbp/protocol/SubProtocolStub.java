package net.orolle.vertigo.fbp.protocol;

import java.util.HashMap;
import java.util.Map;

import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonObject;

import net.orolle.vertigo.fbp.data.FbpUser;

/**
 * A stub which all sub protocols (component, graph, etc.)
 * are extending.
 * 
 * @author Oliver Rolle
 *
 */
public class SubProtocolStub {
  public static final JsonObject EMPTY = new JsonObject();
  
  public final FbpUser user;
  
  private final Map<String, Handler<JsonObject>> handlers = new HashMap<>();
  
  public SubProtocolStub(FbpUser user) {
    super();
    this.user = user;
  }

  /**
   * Handlers for each registered command on this sub protocol
   * 
   * @return
   */
  public Map<String, Handler<JsonObject>> handlers(){
    return handlers;
  }
}
