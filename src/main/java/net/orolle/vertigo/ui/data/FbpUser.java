package net.orolle.vertigo.ui.data;

import java.util.ArrayList;
import java.util.List;

import net.orolle.vertigo.ui.data.jgrapht.JgGraph;
import net.orolle.vertigo.ui.protocol.ComponentSubProtocol;
import net.orolle.vertigo.ui.protocol.FbpNetworkProtocol;
import net.orolle.vertigo.ui.protocol.GraphSubProtocol;
import net.orolle.vertigo.ui.protocol.NetworkSubProtocol;
import net.orolle.vertigo.ui.protocol.RuntimeSubProtocol;

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
  
  public final FbpEnvironment env;
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

  public List<JsonObject> components() {
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
  
  public FbpUser send(JsonObject msg){
    ws.write(new Buffer(msg.encode()));
    return this;
  }

  /**
   * Add a new component and write the component to the UI client
   * @param newComponent
   * @return
   */
  public FbpUser addComponent(JsonObject newComponent) {
    for (int i = 0; i < this.components.size(); i++) {
      JsonObject o = this.components.get(i);
      
      if(o.getString("name", "").equals(newComponent.getString("name", null))){
        this.components.remove(i);
      }
    }
    this.components.add(newComponent);
    
    return this;
  }

  /**
   * Called if websocket is closed.
   */
  @Override
  public void onWebsocketClose() {
    env.removeUser(this);
  }

  public JgGraph graph(String string) {
    return env.graph(string);
  }
  
  public JgGraph graphClear(String string) {
    return env.graphClear(string);
  }
}
