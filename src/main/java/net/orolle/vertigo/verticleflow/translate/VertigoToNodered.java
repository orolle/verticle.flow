package net.orolle.vertigo.verticleflow.translate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map.Entry;
import java.util.Random;

import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

public class VertigoToNodered {
  private final List<JsonObject> networks;
  
  public VertigoToNodered(List<JsonObject> networks) {
    this.networks = networks;
  }

  public JsonArray translate() {
    JsonArray nodered = new JsonArray();
    
    for (JsonObject network : networks) {
      network = network.getObject("network", new JsonObject()).getObject("config", new JsonObject());
      
      String name = network.getString("name", "DEFAULT");
      JsonObject components = network.getObject("components", new JsonObject());
      JsonArray  connections = network.getArray("connections", new JsonArray());
      
      for (JsonObject ele : configToNodered(name, components, connections)) {
        nodered.add(ele);
      }
    }
    
    return nodered;
  }

  private static List<JsonObject> configToNodered(String name, JsonObject components, JsonArray connections) {
    String networkId = randomId();
    JsonObject tab = new JsonObject().putString("type", "tab").putString("id", networkId).putString("label", name);
    
    HashMap<String, JsonObject> nrComponents = new HashMap<>();
    for (String cName : components.getFieldNames()) {
      JsonObject vComponent = components.getObject(cName, new JsonObject());
      String vName = vComponent.getString("name", "DEFAULT");
      JsonObject vConfig = vComponent.getObject("config", new JsonObject());
      int vInstances = vComponent.getInteger("instances", 1);
      String moduleId = vComponent.getString("module", "DEFAULT");
      
      nrComponents.put(cName, createNoderedComponent(networkId, vName, vConfig, vInstances, moduleId));
    }
    
    for (Object o : connections) {
      if (o instanceof JsonObject) {
        JsonObject con = (JsonObject) o;
        JsonObject source = con.getObject("source", new JsonObject());
        JsonObject target = con.getObject("target", new JsonObject());
        String selector = con.getObject("selector", new JsonObject()).getString("type", "");
        
        if(selector.equals("")) { // No selector
          String sComp = source.getString("component");
          String sPort = source.getString("port");
          String tComp = target.getString("component");
          String tPort = target.getString("port");
          
          JsonArray outPort = getOrCreateArray(nrComponents.get(sComp).getObject("wires"), sPort);
          outPort.addObject(new JsonObject().putString("node", tComp)
              .putString("port", tPort));
          
        } else { // Has a selector
          String selectorId = randomId();
          nrComponents.put(selectorId, createNoderedComponent(networkId, selectorId, new JsonObject(), 1, selector));
          
          String sComp = source.getString("component");
          String sPort = source.getString("port");
          String tComp = target.getString("component");
          String tPort = target.getString("port");
          
          JsonArray outPort = getOrCreateArray(nrComponents.get(sComp).getObject("wires"), sPort);
          outPort.addObject(new JsonObject().putString("node", selectorId)
              .putString("port", "in"));
          
          outPort = getOrCreateArray(nrComponents.get(selectorId).getObject("wires"), "out");
          outPort.addObject(new JsonObject().putString("node", tComp)
              .putString("port", tPort));
        }
      }
    }
    
    // Construct Node-Red network
    List<JsonObject> ret = new ArrayList<>();
    ret.add(tab);
    for (Entry<String, JsonObject> e : nrComponents.entrySet()) {
      ret.add(e.getValue());
    }
    
    return ret;
  }

  private static String randomId() {
    return Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE))+"."+Integer.toHexString(new Random().nextInt(Integer.MAX_VALUE)).toLowerCase();
  }

  private static JsonArray getOrCreateArray(JsonObject o, String aName) {
    if(!o.containsField(aName))
      o.putArray(aName, new JsonArray());
    
    return o.getArray(aName);
  }

  private static JsonObject createNoderedComponent(String networkId, String vName, JsonObject vConfig, int vInstances, String moduleId) {
    JsonObject nodered = new JsonObject();
    /*
    "id" : "88dc7d07.b6dce8",
    "type" : "net.orolle.vertigo.module~vertigo-word-feeder~0.1",
    "name" : "net.orolle.vertigo.module~vertigo-word-feeder~0.1",
    "config" : "{\n  \n}",
    "instances" : "1",
    "x" : 182.28334045410156,
    "y" : 201.28334045410156,
    "z" : "a4f6424c.b67458",
    "wires" : {
      "word" : [ {
        "node" : "bcb9f7de.45685",
        "port" : "in"
      } ]
    }
    */
    
    nodered.putString("id", vName)
    .putString("type", moduleId)
    .putString("name", moduleId)
    .putString("config", vConfig.encodePrettily().replace("\n", "\\n"))
    .putString("instances", vInstances+"")
    .putObject("wires", new JsonObject())
    .putString("z", networkId)
    .putNumber("x", 100)
    .putNumber("y", 100);
    
    return nodered;
  }
}
