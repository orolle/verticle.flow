package net.orolle.vertigo.ui.data;

import net.orolle.vertigo.ui.data.jgrapht.JgComponent;

import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

public class FbpVertigo {
  public static final String INPORT_CONFIG = "config";
  public static final String INPORT_INSTANCES = "instances";
  public static final String INPORT_DEFAULT = "default";
  public static final String OUTPORT_DEFAULT = "default";
  
  public static JsonObject createComponent(String name){
    JsonObject component = new JsonObject();
    JsonObject configPort = createPort(INPORT_CONFIG, "configuration", true);
    JsonObject vertigoPort = createPort(INPORT_INSTANCES, "vertigo options", true);
    JsonObject inPort = createPort(INPORT_DEFAULT, "input", true);
    JsonObject outPort = createPort(OUTPORT_DEFAULT, "output", true);
    JsonArray inPorts = new JsonArray();
    JsonArray outPorts = new JsonArray();

    component.putString("name", name)
    .putString("description", "vertigo "+name)
    .putString("icon", "fa-bolt")
    .putBoolean("subgraph", false)
    .putArray("outPorts", outPorts)
    .putArray("inPorts",  inPorts);
    
    if(!isGrouping(name)){
      // Every component has a module config and vertigo config
      inPorts.addObject(vertigoPort);
      inPorts.addObject(configPort);
    }else if(name.equals("fieldsGrouping")){
      // Every fieldsGrouping has a module config 
      inPorts.addObject(configPort);
    }else{
      // Other Groupings have no config
    }
    
    if(!name.toLowerCase().contains("feeder"))
      inPorts.addObject(inPort);
    
    outPorts.addObject(outPort);
    

    return component;
  }

  public static boolean isGrouping(String name) {
    switch (name) {
    case "randomGrouping":
      return true;
    case "roundGrouping":
      return true;
    case "allGrouping":
      return true;
    case "fieldsGrouping":
      return true;
    default:
      return false;
    }
  }

  public static JsonObject createPort(String name, String desc, boolean required){
    JsonObject json = new JsonObject();

    json.putString("id", name)
    .putString("type", "json")
    .putString("description", desc)
    .putBoolean("addressable", false)
    .putBoolean("required", required);

    return json;
  }
}
