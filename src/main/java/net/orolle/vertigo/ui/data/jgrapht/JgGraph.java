package net.orolle.vertigo.ui.data.jgrapht;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

import org.jgrapht.graph.ListenableDirectedGraph;
import org.vertx.java.core.json.JsonObject;

public class JgGraph extends ListenableDirectedGraph<JgComponent, JgConnection> {
  private static final long serialVersionUID = 2660581292938708155L;
  public final String id;
  private String name, library;
  private boolean main;

  public JgGraph(String id) {
    super(JgConnection.class);
    this.id = id;
  }

  public String name() {
    return name;
  }

  public JgGraph name(String name) {
    this.name = name;
    return this;
  }

  public String library() {
    return library;
  }

  public JgGraph library(String library) {
    this.library = library;
    return this;
  }

  public boolean main() {
    return main;
  }

  public JgGraph main(boolean main) {
    this.main = main;
    return this;
  }
  
  public JgConnection createConnection(JsonObject msg){
    String src_id=msg.getObject("src").getString("node"), 
        src_port=msg.getObject("src").getString("port");
    
    String tgt_id=msg.getObject("tgt").getString("node"), 
        tgt_port=msg.getObject("tgt").getString("port");
    
    return new JgConnection(getComponent(src_id), src_port, getComponent(tgt_id), tgt_port);
  }
  
  public JgComponent getComponent(String id){
    int hash = id.hashCode();
    
    for(JgComponent comp : this.vertexSet()){
      if(hash == comp.hashCode()){
        return comp;
      }
    }
    
    return null;
  }
  
  public List<JgConnection> inConnections(String comp){
    return inConnections(getComponent(id));
  }
  
  public List<JgConnection> inConnections(JgComponent comp){
    List<JgConnection> ret = new ArrayList<>();
    
    for (JgConnection jgCon : this.edgeSet()) {
      if(jgCon.getV2() == comp){
        ret.add(jgCon);
      }
    }
    
    return ret;
  }

  public List<JgConnection> outConnections(String comp){
    return outConnections(getComponent(id));
  }
  
  public List<JgConnection> outConnections(JgComponent comp){
    List<JgConnection> ret = new ArrayList<>();
    
    for (JgConnection jgCon : this.edgeSet()) {
      if(jgCon.getV1() == comp){
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
}
