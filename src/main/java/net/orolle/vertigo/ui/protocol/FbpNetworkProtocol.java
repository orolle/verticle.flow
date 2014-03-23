package net.orolle.vertigo.ui.protocol;

import java.util.HashMap;
import java.util.Map;

import org.vertx.java.core.Handler;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.http.ServerWebSocket;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.logging.Logger;

/**
 * Handles the messages recv from the noflo-ui.
 * Connection established via websocket.
 * 
 * @author Oliver Rolle
 *
 */
public abstract class FbpNetworkProtocol {
  public final Logger log;
  public final ServerWebSocket ws;
  
  /**
   * Subprotocol Handlers
   */
  private Map<String, Map<String, Handler<JsonObject>>> fbpHandlers = new HashMap<>();
  
  /**
   * Routes incoming websocket data to subprotocol handlers
   */
  private final Handler<Buffer> dataHandler = new Handler<Buffer>() {
    @Override
    public void handle(Buffer buf) {
      JsonObject body = new JsonObject(buf.toString());
      String protocol = body.getString("protocol", "");
      String command = body.getString("command", "");

      Map<String, Handler<JsonObject>> proto = fbpHandlers.get(protocol);
      if(proto != null){
        Handler<JsonObject> handler = proto.get(command);
        if(handler != null){
          handler.handle(body);
        }else{
          log.warn("Message command not known: "+body.toString());
        }
      }else{
        log.warn("Message protocol not known: "+body.toString());
      }
    }
  };
  
  public FbpNetworkProtocol(ServerWebSocket ws, Logger l){
    this.ws = ws;
    this.log = l;

    ws.dataHandler(dataHandler);
  }

  public Map<String, Map<String, Handler<JsonObject>>> subprotocolHandlers(){
    return this.fbpHandlers;
  }
  
  abstract public void onWebsocketClose();
}
