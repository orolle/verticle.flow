package net.orolle.vertigo.ui.data;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import net.orolle.vertigo.ui.data.jgrapht.JgGraph;

import org.vertx.java.core.Vertx;
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
  
  public final VertigoInterface vertigo;
  
  private final List<JsonObject> components = new ArrayList<>();
  private final Map<String, JgGraph> graphs = new HashMap<>();
  
  public FbpEnvironment(VertigoInterface vertigo) {
    super();
    this.vertigo = vertigo;
    this.vertx = vertigo.vertx;
    this.container = vertigo.container;
    this.log = container.logger();
    
    this.components.add(FbpVertigo.createComponent("net.orolle.vertigo.module~vertigo-word-count-worker~0.1"));
    this.components.add(FbpVertigo.createComponent("net.orolle.vertigo.module~vertigo-word-feeder~0.1"));
    this.components.add(FbpVertigo.createComponent("randomGrouping"));
    this.components.add(FbpVertigo.createComponent("roundGrouping"));
    this.components.add(FbpVertigo.createComponent("allGrouping"));
    this.components.add(FbpVertigo.createComponent("fieldsGrouping"));
  }
  
  public List<JsonObject> listComponents() {
    return components;
  }

  public void addUser(FbpUser fbpUser) {
    
  }
  
  public void removeUser(FbpUser fbpUser) {
    
  }

  public JgGraph graph(String name) {
    if(graphs.get(name) == null){
      graphs.put(name, new JgGraph(name));
    }
    
    return graphs.get(name);
  }

  public JgGraph graphClear(String string) {
    graphs.remove(string);
    return graph(string);
  }
}
