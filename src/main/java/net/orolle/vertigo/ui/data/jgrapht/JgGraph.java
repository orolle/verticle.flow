package net.orolle.vertigo.ui.data.jgrapht;

import java.util.ArrayList;
import java.util.EventListener;
import java.util.EventObject;
import java.util.LinkedList;
import java.util.List;

import org.jgrapht.event.GraphListener;
import org.jgrapht.graph.ListenableDirectedGraph;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;

public class JgGraph extends ListenableDirectedGraph<JgComponent, JgConnection> {
  private static final long serialVersionUID = 2660581292938708155L;
  public final String id;
  private String name, library;
  private boolean main;
  private final List<JgGraphListener> componentChangeListeners = new ArrayList<>(); 
  
  public JgGraph(String id) {
    super(JgConnection.class);
    this.id = id;
  }
  
  public JgGraph addJgGraphListener(JgGraphListener l){
    this.componentChangeListeners.add(l);
    this.addGraphListener(l);
    return this;
  }
  
  public JgGraph fireComponentChange(JgComponent comp){
    JgGraphComponentChangeEvent e = new JgGraphComponentChangeEvent(comp);
    
    for (JgGraphListener l : this.componentChangeListeners) {
      l.componentChanged(e);
    }
    return this;
  }
  
  public JgGraph fireJgGraphChange(JgGraph g){
    JgGraphChangeEvent e = new JgGraphChangeEvent(g);
    
    for (JgGraphListener l : this.componentChangeListeners) {
      l.graphChanged(e);
    }
    return this;
  }

  public String name() {
    return name;
  }

  public JgGraph name(String name) {
    this.name = name;
    fireJgGraphChange(this);
    return this;
  }

  public String library() {
    return library;
  }

  public JgGraph library(String library) {
    this.library = library;
    fireJgGraphChange(this);
    return this;
  }

  public boolean main() {
    return main;
  }

  public JgGraph main(boolean main) {
    this.main = main;
    fireJgGraphChange(this);
    return this;
  }
  
  public JsonObject toFBPNPJson(){
    return new JsonObject()
    .putString("id", id)
    .putString("name", name)
    .putString("library", library)
    .putBoolean("main", main);
  }
  
  public JsonObject toGraphJson(){
    JsonArray components = new JsonArray();
    for (JgComponent c : this.vertexSet()) {
      components.add(c.toJson());
    }
    
    
    JsonArray connections = new JsonArray();
    for (JgConnection c : this.edgeSet()) {
      connections.add(c.toJson());
    }
    
    return toFBPNPJson()
    .putArray("components", components)
    .putArray("connections", connections);
  }
  
  public JgGraph addConnection(JsonObject msg){
    String src_id=msg.getObject("src").getString("node"), 
        src_port=msg.getObject("src").getString("port");
    
    String tgt_id=msg.getObject("tgt").getString("node"), 
        tgt_port=msg.getObject("tgt").getString("port");
    
    JgConnection con = new JgConnection(getComponent(src_id), src_port, getComponent(tgt_id), tgt_port);

    this.addEdge(con.getV1(), con.getV2(), con);
    return this;
  }
  
  public JgComponent getComponent(String id){
    for(JgComponent comp : this.vertexSet()){
      if(id.equals(comp.id())){
        return comp;
      }
    }
    
    return null;
  }
  
  public List<JgConnection> inConnections(String comp){
    return inConnections(getComponent(comp));
  }
  
  public List<JgConnection> inConnections(JgComponent comp){
    List<JgConnection> ret = new ArrayList<>();
    
    for (JgConnection jgCon : this.edgeSet()) {
      if(comp.id().equals(jgCon.getV2().id())){
        ret.add(jgCon);
      }
    }
    
    return ret;
  }

  public List<JgConnection> outConnections(String comp){
    return outConnections(getComponent(comp));
  }
  
  public List<JgConnection> outConnections(JgComponent comp){
    List<JgConnection> ret = new ArrayList<>();
    
    for (JgConnection jgCon : this.edgeSet()) {
      if(comp.id().equals(jgCon.getV1().id())){
        ret.add(jgCon);
      }
    }
    
    return ret;
  }

  public LinkedList<JgComponent> feeders() {
    LinkedList<JgComponent> ret = new LinkedList<>();
    
    for (JgComponent comp : vertexSet()) {
      if(comp.isFeeder())
        ret.add(comp);
    }
    
    return ret;
  }
  
  public static JgGraph parseJgGraph(JsonObject j){
    JgGraph g = new JgGraph(j.getString("id"))
    .name(j.getString("name"))
    .library(j.getString("library"))
    .main(j.getBoolean("main"));
    
    for (Object o : j.getArray("components", new JsonArray())) {
      if (o instanceof JsonObject) {
        JsonObject jc = (JsonObject) o;
        JgComponent comp = new JgComponent(jc);
        g.addVertex(comp);
      }
    }
    
    for (Object o : j.getArray("connections", new JsonArray())) {
      if (o instanceof JsonObject) {
        JsonObject jc = (JsonObject) o;
        g.addConnection(jc);
      }
    }
    
    return g;
  }
}
