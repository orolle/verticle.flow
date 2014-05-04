package net.orolle.vertigo.ui.protocol;

import net.orolle.vertigo.ui.data.FbpUser;

import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonObject;

/**
 * Handles messages of the network sub protocol
 * @author Oliver Rolle
 *
 */
public class NetworkSubProtocol extends SubProtocolStub<NetworkSubProtocol> {
  public static final String protocol = "network";
  /**
   * From net.orolle.vertigo.ui~vertigo-ui-out~x.y
   */
  public static final String uiOutAddress = "net.orolle.vertigo.ui.vertigo-ui-out";

  public NetworkSubProtocol(FbpUser con) {
    super(con);

    user.env.vertx.eventBus().registerHandler(uiOutAddress, new Handler<Message<JsonObject>>() {
      @Override
      public void handle(Message<JsonObject> msg) {
        send("output", new JsonObject().putString("message", msg.body().encodePrettily()));
      }
    });
    
    /*
     * Network
     */
    handlers().put("start", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        System.out.println(msg.encode());
        // response with started msg
        final String graph = payload(msg).getString("graph");
        
        user.env.depolyment(user.env.graph(graph)).deploy(new Handler<JsonObject>() {
          // started
          @Override
          public void handle(JsonObject event) {
            send("started", new JsonObject().putString("graph", graph)
                .putNumber("time", System.currentTimeMillis()));
          }
        }, new Handler<JsonObject>() {
          // excpetion
          @Override
          public void handle(JsonObject event) {
            
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
        final String graph = payload(msg).getString("graph");
        
        if(user.env.depolyment(user.env.graph(graph)) != null){
          user.env.depolyment(user.env.graph(graph)).remove(new Handler<JsonObject>() {
            // stopped
            @Override
            public void handle(JsonObject data) {
              send("stopped", new JsonObject().putString("graph", graph)
                  .putNumber("time", data.getNumber("time"))
                  .putNumber("uptime", data.getNumber("uptime")));
            }
          },new Handler<JsonObject>() {
            @Override
            public void handle(JsonObject event) {
              // TODO Auto-generated method stub
              
            }});
        }
      }
    });
    
    handlers().put("edges", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        //throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
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

  @Override
  public NetworkSubProtocol send(String cmd, JsonObject payload) {
    JsonObject msg = new JsonObject()
    .putString("protocol", protocol)
    .putString("command", cmd)
    .putObject("payload", payload);
    
    user.send(msg);
    return this;
  }

}
