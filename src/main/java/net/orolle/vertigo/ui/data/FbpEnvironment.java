package net.orolle.vertigo.ui.data;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import net.orolle.vertigo.ui.data.jgrapht.JgComponent;
import net.orolle.vertigo.ui.data.jgrapht.JgConnection;
import net.orolle.vertigo.ui.data.jgrapht.JgGraph;
import net.orolle.vertigo.ui.data.jgrapht.JgGraphChangeEvent;
import net.orolle.vertigo.ui.data.jgrapht.JgGraphComponentChangeEvent;
import net.orolle.vertigo.ui.data.jgrapht.JgGraphListener;

import org.jgrapht.event.GraphEdgeChangeEvent;
import org.jgrapht.event.GraphListener;
import org.jgrapht.event.GraphVertexChangeEvent;
import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.Handler;
import org.vertx.java.core.Vertx;
import org.vertx.java.core.buffer.Buffer;
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
  private final Set<FbpUser> users = new HashSet<>();
  private final HashMap<String, IVertigoDeployment> networks = new HashMap<>();
  private final JgGraphListener exporter = new JgGraphListener() {
    @Override
    public void vertexRemoved(GraphVertexChangeEvent<JgComponent> e) {
      exportAll();
    }

    @Override
    public void vertexAdded(GraphVertexChangeEvent<JgComponent> e) {
      exportAll();
    }

    @Override
    public void edgeRemoved(GraphEdgeChangeEvent<JgComponent, JgConnection> e) {
      exportAll();
    }

    @Override
    public void edgeAdded(GraphEdgeChangeEvent<JgComponent, JgConnection> e) {
      exportAll();
    }

    @Override
    public void componentChanged(JgGraphComponentChangeEvent e) {
      exportAll();
    }

    @Override
    public void graphChanged(JgGraphChangeEvent e) {
      exportAll();
    }
  };

  public FbpEnvironment(VertigoInterface vertigo) {
    super();
    this.vertigo = vertigo;
    this.vertx = vertigo.vertx;
    this.container = vertigo.container;
    this.log = container.logger();

    this.loadComponents();
    this.loadGraphs();
  }

  private FbpEnvironment loadComponents(){
    loadLocalMavenComponents(container.config().getString("maven",System.getProperty("user.home")+File.separator+".m2"));

    //this.components.add(FbpVertigo.createComponent("net.orolle.vertigo.module~vertigo-word-count-worker~0.1"));
    //this.components.add(FbpVertigo.createComponent("net.orolle.vertigo.module~vertigo-word-feeder~0.1"));
    this.components.add(FbpVertigo.createComponent("randomGrouping"));
    this.components.add(FbpVertigo.createComponent("roundGrouping"));
    this.components.add(FbpVertigo.createComponent("allGrouping"));
    this.components.add(FbpVertigo.createComponent("fieldsGrouping"));

    return this;
  }

  private void loadLocalMavenComponents(String path) {
    
    if(new File(path).isDirectory()){
      // Directory
      vertx.fileSystem().readDir(path, new Handler<AsyncResult<String[]>>() {
        @Override
        public void handle(AsyncResult<String[]> event) {
          if(event.succeeded()) {
            for (String sub : event.result()) {
              loadLocalMavenComponents(sub);
            }
          }
        }
      });
    } else {
      // File
      if(new File(path).getName().endsWith("-mod.zip")) {
        String moduleId = moduleId(path);
        this.components.add(FbpVertigo.createComponent(moduleId));
      }
    }
  }

  private String moduleId(String path) {
    path = path.split(System.getProperty("user.home")+File.separator+".m2"+File.separator+"repository"+File.separator)[1];
    String[] segment = path.split(File.separator);
    
    String version = segment[segment.length-2];
    String name = segment[segment.length-3];
    
    String owner = ""; 
    for (int i = 0; i < segment.length-3; i++) {
      owner += (i==0? "" : ".") + segment[i];
    }
    
    return owner+"~"+name+"~"+version;
  }

  private FbpEnvironment loadGraphs(){
    String path = container.config().getString("vertigo-ui-networks-file", "vertigo-ui-networks.json");
    JsonObject storedNetworks = new JsonObject(vertx.fileSystem().readFileSync(path).toString());

    for (String graphId : storedNetworks.toMap().keySet()) {
      JgGraph graph = JgGraph.parseJgGraph(storedNetworks.getObject(graphId));

      this.graphs.put(graphId, graph);
      graph.addJgGraphListener(exporter);
    }

    return this;
  }

  public List<JsonObject> listComponents() {
    return components;
  }

  public List<JgGraph> listGraphs() {
    ArrayList<JgGraph> graphs = new ArrayList<>(this.graphs.size());

    for (Entry<String, JgGraph> e : this.graphs.entrySet()) {
      graphs.add(e.getValue());
    }

    return graphs;
  }

  public void addUser(FbpUser user) {
    this.users.add(user);
  }

  public void removeUser(FbpUser fbpUser) {
    this.users.remove(fbpUser);
  }

  public JgGraph graph(String id) {
    return graphs.get(id);
  }

  public JgGraph graphClear(String id) {
    graphs.remove(id);
    graphs.put(id, new JgGraph(id));

    graph(id).addJgGraphListener(exporter);
    return graph(id);
  }

  public void exportAll(){
    JsonObject export = new JsonObject();
    for (Entry<String, JgGraph> e : this.graphs.entrySet()) {
      export.putObject(e.getKey(), e.getValue().toGraphJson());
    }
    String path = container.config().getString("vertigo-ui-networks-file", "vertigo-ui-networks.json");
    vertx.fileSystem().writeFileSync(path, new Buffer(export.encodePrettily()));
  }

  public IVertigoDeployment depolyment(final JgGraph graph){
    if(!networks.containsKey(graph.id)){
      return makeDeployment(graph);
    }

    return networks.get(graph.id);
  }

  private IVertigoDeployment makeDeployment(final JgGraph graph) {
    final IVertigoDeployment old = vertigo.deployment(graph);
    IVertigoDeployment i = new IVertigoDeployment() {
      @Override
      public void init() {
        networks.put(graph.id, this);
        old.init();
      }
      @Override
      public void deploy(Handler<JsonObject> startedHandler,
          Handler<JsonObject> exceptionHandler) {
        old.deploy(startedHandler, exceptionHandler);
      }
      @Override
      public void shutdown(Handler<JsonObject> stoppededHandler,
          Handler<JsonObject> exceptionHandler) {
        old.shutdown(stoppededHandler, exceptionHandler);
      }
      @Override
      public void remove(Handler<JsonObject> stoppededHandler,
          Handler<JsonObject> exceptionHandler) {
        networks.remove(graph.id);
        old.remove(stoppededHandler, exceptionHandler);
      }
    };
    i.init();
    return i;
  }
}
