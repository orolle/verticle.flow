package net.orolle.vertigo.fbp.data;

import java.util.ArrayList;
import java.util.List;

import net.orolle.vertigo.fbp.protocol.ComponentSubProtocol;
import net.orolle.vertigo.fbp.protocol.FbpNetworkProtocol;
import net.orolle.vertigo.fbp.protocol.GraphSubProtocol;
import net.orolle.vertigo.fbp.protocol.NetworkSubProtocol;
import net.orolle.vertigo.fbp.protocol.RuntimeSubProtocol;

import org.vertx.java.core.Vertx;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.http.ServerWebSocket;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.platform.Container;

/**
 * Handles and holds data of a single fbp network protocol connection.
 * @author Oliver Rolle
 *
 */
public class FbpUser extends FbpNetworkProtocol {
  public final Vertx vertx;
  public final Container container;
  
  private final FbpEnvironment env;
  private final List<JsonObject> components = new ArrayList<>();

  public FbpUser(FbpEnvironment env, ServerWebSocket ws) {
    super(ws, env.log);
    this.env = env;
    this.vertx = env.vertx;
    this.container = env.container;
    
    this.subprotocolHandlers().put("runtime", new RuntimeSubProtocol(this).handlers());
    this.subprotocolHandlers().put("graph", new GraphSubProtocol(this).handlers());
    this.subprotocolHandlers().put("component", new ComponentSubProtocol(this).handlers());
    this.subprotocolHandlers().put("network", new NetworkSubProtocol(this).handlers());
    
    env.addUser(this);
  }

  private List<JsonObject> aggregateComponents() {
    ArrayList<JsonObject> comps = new ArrayList<>
    (components.size() + env.listComponents().size());

    for (JsonObject o : env.listComponents()) {
      comps.add(o);
    }
    for (JsonObject o : this.components) {
      comps.add(o);
    }

    return comps;
  }
  
  /**
   * Lists all components to the UI client
   * @return
   */
  public FbpUser listComponents(){
    List<JsonObject> comps = aggregateComponents();
    
    for (JsonObject component : comps) {
      writeComponent(component);
    }
    
    return this;
  }
  
  private FbpUser writeComponent(JsonObject component){
    JsonObject reply = new JsonObject().putString("protocol", "component")
        .putString("command", "list")
        .putObject("payload", component);
    ws.write(new Buffer(reply.encode()));
    return this;
  }

  /**
   * Add a new component and write the component to the UI client
   * @param newComponent
   * @return
   */
  public FbpUser addComponent(JsonObject newComponent) {
    if(newComponent.getString("name") == null || newComponent.getString("code") == null){
      log.warn("FbpUser.addComponent(): Component has not right structure: "+newComponent.toString());
      return this;
    }
    
    for (int i = 0; i < this.components.size(); i++) {
      JsonObject o = this.components.get(i);
      
      if(o.getString("name", "").equals(newComponent.getString("name", null))){
        this.components.remove(i);
      }
    }
    
    JsonObject uiComponent = env.createComponent(newComponent.getString("name"));
    this.components.add(uiComponent);
    this.writeComponent(uiComponent);
    
    return this;
  }

  /**
   * Called if websocket is closed.
   */
  @Override
  public void onWebsocketClose() {
    env.removeUser(this);
  }
}
