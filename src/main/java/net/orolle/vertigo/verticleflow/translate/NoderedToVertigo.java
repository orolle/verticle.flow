package net.orolle.vertigo.verticleflow.translate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map.Entry;

import net.orolle.vertigo.verticleflow.VertigoComponent;

import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

class JgComponent extends JsonObject {
  private static final long serialVersionUID = -5399946357927608789L;
  private final List<JgConnection> out = new ArrayList<>();
  private final List<JgConnection> in  = new ArrayList<>();

  public JgComponent(JsonObject json) {
    this.mergeIn(json);
  }

  public String moduleId() {
    return this.getString("type");
  }
  
  public String instanceId() {
    return this.getString("id");
  }

  public int instances() {
    return this.getInteger("instances", 1);
  }

  public JsonObject config() {
    return new JsonObject(this.getString("config", "{}"));
  }

  public List<JgConnection> outConnections() {
    return out;
  }
  
  public JgComponent addOutConnection(JgConnection con) {
    if(con.getV1() == this) {
      this.out.add(con);
      return this;
    }
    
    throw new IllegalStateException("Not an out connection of this object.");
  }
  
  public List<JgConnection> inConnections() {
    return in;
  }
  
  public JgComponent addInConnection(JgConnection con) {
    if(con.getV2() == this) {
      this.in.add(con);
      return this;
    }
    
    throw new IllegalStateException("Not an out connection of this object.");
  }

  public boolean isGrouping() {
    return VertigoComponent.isGrouping(this.getString("type"));
  }
  
  public boolean isComponent() {
    return !isGrouping();
  }

  public JsonObject toVertigoJson() {
    return new JsonObject()
    .putString("name", instanceId())
    .putString("type", "module")
    .putString("module", moduleId())
    .putElement("config", config())
    .putNumber("instances", instances());
  }
}

class JgConnection {
  private final JgComponent v1, v2;
  private final String port1, port2;
  
  public JgConnection(JgComponent v1, String port1, JgComponent v2, String port2) {
    super();
    this.v1 = v1;
    this.v2 = v2;
    this.port1 = port1;
    this.port2 = port2;
  }

  public JgComponent getV1() {
    return v1;
  }

  public JgComponent getV2() {
    return v2;
  }

  public String getV1Port() {
    return port1;
  }

  public String getV2Port() {
    return port2;
  }
}

class Translator {
  private final HashMap<String, JgComponent> components;
  private final HashSet<Integer> blacklist;
  private final JsonObject network;

  public Translator(String name, List<JsonObject> flowNodes){
    this.components = new HashMap<>(flowNodes.size());
    this.blacklist = new HashSet<>(flowNodes.size());
    this.network = new JsonObject().putString("name", name) //.putString("cluster", "verticle.flow")
        .putObject("components", new JsonObject()).putArray("connections", new JsonArray());
    
    build(flowNodes);
  }
  
  private void build(List<JsonObject> flowNodes) {
    for (JsonObject json : flowNodes) {
      components.put(json.getString("id"), new JgComponent(json));
    }
    
    for (JsonObject json : flowNodes) {
      JgComponent sourceNode = components.get(json.getString("id"));
      
      for (String sourcePort : sourceNode.getObject("wires").getFieldNames()) {
        for (Object o : sourceNode.getObject("wires").getArray(sourcePort)) {
          if (o instanceof JsonObject) {
            JsonObject tgt = (JsonObject) o;
            String targetPort = tgt.getString("port");
            JgComponent targetNode = components.get(tgt.getString("node"));
            JgConnection con = new JgConnection(sourceNode, sourcePort, targetNode, targetPort);
            
            sourceNode.addOutConnection(con);
            targetNode.addInConnection(con);
          }
        }
      }
    }
  }
  
  public JsonObject translate(){
    for (JgComponent c : components.values()) {
      if(c.isComponent())
        network.getObject("components").putObject(c.instanceId(), c.toVertigoJson());
    }
    
    for (JgComponent feeder : inDegree0()) {
      for (JgConnection con : feeder.outConnections()) {
        LinkedList<JgConnection> queue = new LinkedList<>();
        queue.add(con);
        traverse(queue);
      }
    }
    
    return network;
  }

  private List<JgComponent> inDegree0() {
    List<JgComponent> feeder = new ArrayList<>();
    
    for (Entry<String, JgComponent> e : this.components.entrySet()) {
      if(e.getValue().inConnections().size() == 0) {
        feeder.add(e.getValue());
      }
    }
    
    return feeder;
  }

  private void traverse(LinkedList<JgConnection> queue) {
    if(queue.isEmpty())
      return;

    // first element in queue is second element of Grouping connection. Queue: b -> c, a -> b
    JgConnection first   = queue.size() >= 2? queue.get(1) : null;
    JgConnection mid = queue.get(0);
    
    if(mid != null && mid.getV1().isComponent() && mid.getV2().isComponent()){
      JsonObject con = new JsonObject()
      .putObject("source", new JsonObject().putString("component", mid.getV1().instanceId()).putString("port", mid.getV1Port()))
      .putObject("target", new JsonObject().putString("component", mid.getV2().instanceId()).putString("port", mid.getV2Port()))
      .putObject("selector", new JsonObject().putString("type", "fair"));
      
      if(!blacklist.contains(con.toString().hashCode())){
        network.getArray("connections").add(con);
        blacklist.add(con.toString().hashCode());
      }
    }else if(mid != null && first != null && 
        first.getV1().isComponent() && first.getV2().isGrouping() &&
        mid.getV1().isGrouping() && mid.getV2().isComponent()){
      
      JsonObject con = new JsonObject()
      .putObject("source", new JsonObject().putString("component", first.getV1().instanceId()).putString("port", first.getV1Port()))
      .putObject("target", new JsonObject().putString("component", mid.getV2().instanceId()).putString("port", mid.getV2Port()))
      .putObject("selector", new JsonObject().putString("type", first.getV2().moduleId()));
      
      if(!blacklist.contains(con.toString().hashCode())){
        network.getArray("connections").add(con);
        blacklist.add(con.toString().hashCode());
      }
    }

    for (JgConnection con : mid.getV2().outConnections()) {
      queue.push(con);
      traverse(queue);
      queue.pop();
    }
  }
}

public class NoderedToVertigo {
  private final List<JsonObject> vertigoNetworks = new ArrayList<>();
  
  public NoderedToVertigo(JsonArray flow) {
    super();
    HashMap<String, String> netNames = new HashMap<>();
    HashMap<String, List<JsonObject>> netNodes = new HashMap<>();
    
    for (Object o : flow) {
      if (o instanceof JsonObject) {
        JsonObject json = (JsonObject) o;
        
        if(json.getString("type", "").equals("tab")) {
          netNames.put(json.getString("id"), json.getString("label"));
          
        } else if (!json.getString("type", "").equals("")) {
          if(netNodes.get(json.getString("z", "")) == null) {
            netNodes.put(json.getString("z", ""), new ArrayList<JsonObject>());
          }
          
          Object number = json.getValue("instances");
          if (number instanceof String) {
            int i = 1;
            try {
              i = Integer.parseInt(number.toString());
            } catch (Exception e) { 
              e.printStackTrace();
            }
            json.putNumber("instances", i);
          }
          
          netNodes.get(json.getString("z", "")).add(json);
        }
      }
    }
    
    for(Entry<String, String> e : netNames.entrySet()) {
      String netId = e.getKey();
      String netName = e.getValue();
      
      vertigoNetworks.add(new Translator(netName, netNodes.get(netId)).translate());
    }
  }
  
  public List<JsonObject> translate() {
    return vertigoNetworks;
  }
}
