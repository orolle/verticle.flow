package net.orolle.vertigo.ui.protocol;

import net.orolle.vertigo.ui.data.FbpUser;
import net.orolle.vertigo.ui.data.FbpVertigo;
import net.orolle.vertigo.ui.data.jgrapht.JgComponent;
import net.orolle.vertigo.ui.data.jgrapht.JgConnection;
import net.orolle.vertigo.ui.data.jgrapht.JgGraph;
import net.orolle.vertigo.ui.util.Parse;

import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonElement;
import org.vertx.java.core.json.JsonObject;

/**
 * Handles messages of the graph sub protocol
 * @author Oliver Rolle
 *
 */
public class GraphSubProtocol extends SubProtocolStub<GraphSubProtocol> {
  public static final String protocol = "graph";

  public GraphSubProtocol(FbpUser f) {
    super(f);

    /*
     * Graph
     */
    this.handlers().put("clear", new Handler<JsonObject>() {
      @Override
      public void handle(final JsonObject msg) {
        System.out.println(msg.encode());
        final String graphId = payload(msg).getString("id");

        if(user.graph(graphId) == null){
          user.graphClear(graphId)
          .name(payload(msg).getString("name", ""))
          .library(payload(msg).getString("library", ""))
          .main(payload(msg).getBoolean("main", false));
        }

        // first send all components
        for(JgComponent comp : user.graph(graphId).vertexSet()){
          if(comp.isComponent() || comp.isGrouping()){
            send("addnode", comp.toJson().putString("graph", graphId));
          }
        }

        // second send all connections
        for(JgComponent comp : user.graph(graphId).vertexSet()){
          if(comp.isComponent() || comp.isGrouping()){
            for(JgConnection con : user.graph(graphId).outConnections(comp)){
              JsonObject edge = new JsonObject();
              edge.putString("graph", graphId);
              edge.putObject("src", 
                  new JsonObject().putString("node", con.getV1().id()).putString("port", con.getV1Port()));
              edge.putObject("tgt", 
                  new JsonObject().putString("node", con.getV2().id()).putString("port", con.getV2Port()));

              send("addedge", edge);
            }
          }
        }
      }
    });

    this.handlers().put("addnode", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {     
        //System.out.println(msg.encode());
        String graph = payload(msg).getString("graph");
        payload(msg).removeField("graph");

        if(user.graph(graph).getComponent(payload(msg).getString("id")) == null)
          user.graph(graph).addVertex(new JgComponent(payload(msg)));
      }
    });

    this.handlers().put("changenode", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {     
        //System.out.println(msg.encode());
        JgGraph graph = user.graph(payload(msg).getString("graph"));
        String id = payload(msg).getString("id", "");
        JsonObject metadata = payload(msg).getObject("metadata", new JsonObject());
        graph.getComponent(id).metadata(metadata);
        graph.fireComponentChange(graph.getComponent(id));
      }
    });

    this.handlers().put("removenode", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        //System.out.println(msg.encode());
        String id = payload(msg).getString("id", "");
        JgGraph graph = user.graph(payload(msg).getString("graph"));
        JgComponent comp = graph.getComponent(id);
        payload(msg).removeField("graph");

        if(comp != null){
          graph.removeVertex(comp); 
        }
      }
    });

    this.handlers().put("addedge", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        //System.out.println(msg.encode());
        String graph = payload(msg).getString("graph");
        payload(msg).removeField("graph");

        user.graph(graph).addConnection(payload(msg));
      }
    });

    this.handlers().put("removeedge", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        System.out.println(msg.encode());
        String from = payload(msg).getObject("src").getString("node", "");
        String to   = payload(msg).getObject("tgt").getString("node", "");
        JgGraph graph = user.graph(payload(msg).getString("graph"));

        for (JgConnection con : graph.outConnections(from)) {
          if(to.equals(con.getV2().id())){
            graph.removeEdge(con);
            return;
          }
        }
      }
    });

    this.handlers().put("addinitial", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        //System.out.println(msg.encode());

        String graph = payload(msg).getString("graph");
        String node = payload(msg).getObject("tgt").getString("node");
        String port = payload(msg).getObject("tgt").getString("port");
        String data = payload(msg).getObject("src").getString("data");

        switch (port) {

        case FbpVertigo.INPORT_CONFIG:
          JsonElement json = Parse.toJson(data, new JsonObject());
          if(json != null){
            user.graph(graph).getComponent(node)
            .config(json);
          }
          break;

        case FbpVertigo.INPORT_INSTANCES:
          int instances = Parse.toInteger(data, 1);
          user.graph(graph).getComponent(node)
          .instances(instances);
          break;

        default:
          break;
        }
      }
    });

    this.handlers().put("removeinitial", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        //System.out.println(msg.encode());

        String graph = payload(msg).getString("graph");
        String node = payload(msg).getObject("tgt").getString("node");
        String port = payload(msg).getObject("tgt").getString("port");

        switch (port) {

        case FbpVertigo.INPORT_CONFIG:
          user.graph(graph).getComponent(node)
          .config(new JsonObject());
          break;

        case FbpVertigo.INPORT_INSTANCES:
          user.graph(graph).getComponent(node)
          .instances(1);
          break;

        default:
          break;
        }
      }
    });

    this.handlers().put("addinport", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });

    this.handlers().put("removeinport", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });

    this.handlers().put("addoutport", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });

    this.handlers().put("removeoutport", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });

    this.handlers().put("renamenode", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });
  }


  public GraphSubProtocol send(String cmd, JsonObject payload){
    JsonObject msg = new JsonObject()
    .putString("protocol", protocol)
    .putString("command", cmd)
    .putObject("payload", payload);

    System.out.println("SEND "+msg.encode());
    user.send(msg);

    return this;
  }


  public GraphSubProtocol sendGraphs() {
    for (JgGraph g : user.env.listGraphs()) {
      send("clear", g.toFBPNPJson());
    }

    return this;
  }
}
