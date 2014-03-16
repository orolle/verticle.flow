package net.orolle.vertigo.fbp.protocol;

import net.orolle.vertigo.fbp.data.FbpUser;

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
        user.listComponents();
      }
    });
    
    this.handlers().put("source", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        user.log.info("[component,source]");
        user.addComponent(msg.getObject("payload", EMPTY));
      }
    });

    this.handlers().put("getsource", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
  }
}
