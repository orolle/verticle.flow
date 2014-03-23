package net.orolle.vertigo.ui.data;

import net.kuujo.vertigo.network.Network;
import net.kuujo.vertigo.util.serializer.SerializerFactory;
import net.orolle.vertigo.ui.data.jgrapht.JgGraph;

import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.Handler;
import org.vertx.java.core.Vertx;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.platform.Container;

/**
 * Translates graphs to vertigo networks.
 * 
 * @author Oliver Rolle
 *
 */
public class VertigoInterface {
  public final Vertx vertx;
  public final Container container;
  public final Logger log;
  
  public VertigoInterface(Vertx vertx, Container container) {
    super();
    this.vertx = vertx;
    this.container = container;
    this.log = container.logger();
  }
  
  public void start(JgGraph graph, final Handler<JsonObject> startedHandler){
    Network network = new NetworkTranslator(graph).translate();
    
    JsonObject net_conf = new JsonObject(SerializerFactory.getSerializer(Network.class).serializeToString(network));
    JsonObject config = new JsonObject().putObject("network", net_conf);
    System.out.println(net_conf.encodePrettily());
    
    container.deployVerticle(VertigoClient.class.getCanonicalName(), config, 1, new Handler<AsyncResult<String>>() {
      @Override
      public void handle(AsyncResult<String> event) {
        if(event.failed()){
          event.cause().printStackTrace();
        }
        
        if(event.succeeded()){
          container.undeployVerticle(event.result());
        }
      }
    });
  }
}
