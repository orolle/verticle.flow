package net.orolle.vertigo.ui.protocol;

import net.orolle.vertigo.ui.data.FbpUser;

import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonObject;

/**
 * Handles messages of the runtime sub protocol
 * @author Oliver Rolle
 *
 */
public class RuntimeSubProtocol extends SubProtocolStub<RuntimeSubProtocol> {
  public static final String protocol = "runtime";
  
  public RuntimeSubProtocol(FbpUser con) {
    super(con);
    
    /*
     * RUNTIME
     */
    handlers().put("getruntime", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        // send runtime message
        
        // send ports message
        
        // send packet message (external sub graph)
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
  }

  @Override
  public RuntimeSubProtocol send(String cmd, JsonObject payload) {
    JsonObject msg = new JsonObject()
    .putString("protocol", protocol)
    .putString("command", cmd)
    .putObject("payload", payload);
    
    user.send(msg);
    return this;
  }

}
