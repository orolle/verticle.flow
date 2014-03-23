package net.orolle.vertigo.ui.protocol;

import net.orolle.vertigo.ui.data.FbpUser;

import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonObject;

/**
 * Handles messages of the network sub protocol
 * @author Oliver Rolle
 *
 */
public class NetworkSubProtocol extends SubProtocolStub {

  public NetworkSubProtocol(FbpUser con) {
    super(con);
    
    
    /*
     * Network
     */
    handlers().put("start", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        System.out.println(msg.encode());
        // response with started msg
        final String graph = payload(msg).getString("graph");
        
        user.env.vertigo.start(user.graph(graph), new Handler<JsonObject>() {
          
          @Override
          public void handle(JsonObject event) {
            // started msg
            user.send(new JsonObject().putString("graph", graph)
                .putNumber("time", System.currentTimeMillis()));
          }
        });
      }
    });
    
    handlers().put("getstatus", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        // response with status msg
        
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
    
    handlers().put("stop", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        // response with stopped msg
        
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
    
    handlers().put("edges", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
    
    /*
     * Rewrite following code!
     * Status msgs from vertigo to UI
     * 
    handlers().put("icon", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
    
    handlers().put("output", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
    
    handlers().put("error", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
    
    handlers().put("connect", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
    
    handlers().put("begingroup", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
    
    handlers().put("data", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
    
    handlers().put("endgroup", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
    
    handlers().put("disconnect", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
    */
  }

}
