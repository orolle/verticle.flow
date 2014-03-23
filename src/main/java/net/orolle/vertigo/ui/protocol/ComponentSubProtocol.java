package net.orolle.vertigo.ui.protocol;

import net.orolle.vertigo.ui.data.FbpVertigo;
import net.orolle.vertigo.ui.data.FbpUser;

import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonObject;

/**
 * Handles messages of the component sub protocol
 * @author Oliver Rolle
 *
 */
public class ComponentSubProtocol extends SubProtocolStub {

  public ComponentSubProtocol(FbpUser f) {
    super(f);

    /*
     * Component
     */
    this.handlers().put("list", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        user.log.info("[component,list]");
        
        for (JsonObject comp : user.components()) {
          sendComponent(comp);
        }
      }
    });
    
    this.handlers().put("source", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        user.log.info("[component,source]");
        JsonObject comp = FbpVertigo.createComponent(msg.getObject("payload", EMPTY).getString("name"));
        
        user.addComponent(comp);
        sendComponent(comp);
      }
    });

    this.handlers().put("getsource", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
  }
  
  private FbpUser sendComponent(JsonObject component){
    JsonObject reply = new JsonObject().putString("protocol", "component")
        .putString("command", "list")
        .putObject("payload", component);
    return user.send(reply);
  }
}
