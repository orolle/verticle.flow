package net.orolle.vertigo.ui.protocol;

import net.orolle.vertigo.ui.data.FbpVertigo;
import net.orolle.vertigo.ui.data.FbpUser;
import net.orolle.vertigo.ui.data.jgrapht.JgComponent;
import net.orolle.vertigo.ui.data.jgrapht.JgConnection;
import net.orolle.vertigo.ui.util.Parse;

import org.vertx.java.core.Handler;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonElement;
import org.vertx.java.core.json.JsonObject;

/**
 * Handles messages of the graph sub protocol
 * @author Oliver Rolle
 *
 */
public class GraphSubProtocol extends SubProtocolStub {

  public GraphSubProtocol(FbpUser f) {
    super(f);

    /*
     * Graph
     */
    this.handlers().put("clear", new Handler<JsonObject>() {
      @Override
      public void handle(final JsonObject msg) {

        user.graphClear(payload(msg).getString("id"))
        .name(payload(msg).getString("name", ""))
        .library(payload(msg).getString("library", ""))
        .main(payload(msg).getBoolean("main", false));

      }
    });

    this.handlers().put("addnode", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {     
        System.out.println(msg.encode());
        String graph = payload(msg).getString("graph");
        payload(msg).removeField("graph");

        user.graph(graph).addVertex(new JgComponent(payload(msg)));
      }
    });

    this.handlers().put("removenode", new Handler<JsonObject>() {
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

    this.handlers().put("addedge", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        System.out.println(msg.encode());
        String graph = payload(msg).getString("graph");
        payload(msg).removeField("graph");

        JgConnection con = user.graph(graph).createConnection(payload(msg));

        user.graph(graph).addEdge(con.getV1(), con.getV2(), con);
      }
    });

    this.handlers().put("removeedge", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
      }
    });

    this.handlers().put("addinitial", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        System.out.println(msg.encode());

        String graph = payload(msg).getString("graph");
        String data = payload(msg).getObject("src").getString("data");
        String port = payload(msg).getObject("tgt").getString("port");

        switch (port) {
        
        case FbpVertigo.INPORT_CONFIG:
          JsonElement json = Parse.toJson(data, null);
          if(json != null){
            user.graph(graph).getComponent(payload(msg).getObject("tgt").getString("node"))
            .config(json);
          }
          break;

        case FbpVertigo.INPORT_INSTANCES:
          int instances = Parse.toInteger(data, 1);
          user.graph(graph).getComponent(payload(msg).getObject("tgt").getString("node"))
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
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
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
  }


  public JsonObject graphMsg(String cmd, JsonObject payload){
    JsonObject msg = new JsonObject()
    .putString("protocol", "graph")
    .putString("command", cmd)
    .putObject("payload", payload);

    return msg;
  }
}
