package net.orolle.vertigo.fbp.protocol;

import net.orolle.vertigo.fbp.data.FbpUser;

import org.vertx.java.core.Handler;
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
      public void handle(JsonObject msg) {
        user.log.info("[graph,clear] id="+msg.getObject("payload").getString("id"));
      }
    });
    
    this.handlers().put("addnode", new Handler<JsonObject>() {
      @Override
      public void handle(JsonObject msg) {
        user.log.error("addnode: NOT IMPLEMENTED");
        
        //throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
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
        user.log.error("addedge: NOT IMPLEMENTED");
        //throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
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
        throw new IllegalStateException("NOT IMPLEMENTED:\n"+msg.encodePrettily()+"\n");
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

}
