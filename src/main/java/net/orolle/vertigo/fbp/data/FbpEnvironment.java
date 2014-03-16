package net.orolle.vertigo.fbp.data;

import java.util.ArrayList;
import java.util.List;

import org.vertx.java.core.Vertx;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.platform.Container;

/**
 * Holds data of the global fbp environment.
 * Used for sharing data between users. 
 * @author Oliver Rolle
 *
 */
public class FbpEnvironment {
  public final Vertx vertx;
  public final Container container;
  public final Logger log;
  
  private final VertigoInterface vertigo;
  
  private final List<JsonObject> components = new ArrayList<>();
  
  public FbpEnvironment(VertigoInterface vertigo) {
    super();
    this.vertigo = vertigo;
    this.vertx = vertigo.vertx;
    this.container = vertigo.container;
    this.log = container.logger();
    
    this.components.add(createComponent("Feeder"));
    this.components.add(createComponent("Worker"));
  }
  
  public List<JsonObject> listComponents() {
    return components;
  }
  
  public JsonObject createComponent(String name){
    JsonObject component = new JsonObject();
    JsonObject inPort = createPort("IN", "input", true);
    JsonObject outPort = createPort("OUT", "output", true);
    JsonArray inPorts = new JsonArray();
    JsonArray outPorts = new JsonArray();
    
    if(!name.equals("Feeder"))
      inPorts.addObject(inPort);
    
    outPorts.addObject(outPort);
      

    component.putString("name", name)
    .putString("description", "Worker Feeder Vertigo")
    .putString("icon", "fa-bolt")
    .putBoolean("subgraph", false)
    .putArray("outPorts", outPorts)
    .putArray("inPorts",  inPorts);

    return component;
  }

  public JsonObject createPort(String name, String desc, boolean required){
    JsonObject json = new JsonObject();

    json.putString("id", name)
    .putString("type", "json")
    .putString("description", desc)
    .putBoolean("addressable", false)
    .putBoolean("required", required);

    return json;
  }

  public void addUser(FbpUser fbpUser) {
    
  }
  
  public void removeUser(FbpUser fbpUser) {
    
  }
}
