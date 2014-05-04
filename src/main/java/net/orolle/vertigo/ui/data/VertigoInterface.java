package net.orolle.vertigo.ui.data;

import java.util.HashMap;
import java.util.UUID;

import net.kuujo.vertigo.Vertigo;
import net.kuujo.vertigo.context.NetworkContext;
import net.kuujo.vertigo.network.Network;
import net.kuujo.vertigo.util.serializer.SerializerFactory;
import net.orolle.vertigo.ui.data.jgrapht.JgGraph;

import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.Handler;
import org.vertx.java.core.Vertx;
import org.vertx.java.core.eventbus.Message;
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
  public final Vertigo<?> vertigo;
  public final Container container;
  public final Logger log;

  private final HashMap<String, VertigoClientCommunication> networks = new HashMap<>();

  class VertigoClientCommunication implements IVertigoDeployment{
    public final String id = UUID.randomUUID().toString();
    public final JsonObject network;
    private NetworkContext context;
    private boolean isRemoving = false;

    private long started=-1;

    public VertigoClientCommunication(JsonObject network) {
      this.network = network;

      init();
    }

    public void init() {
      networks.put(id, this);
    }

    public void deploy(final Handler<JsonObject> startedHandler, final Handler<JsonObject> exceptionHandler) {
      System.out.println(this.network.encodePrettily());
      
      Network network = Network.fromJson(this.network);
      vertigo.deployLocalNetwork(network, new Handler<AsyncResult<NetworkContext>>() {
        @Override
        public void handle(AsyncResult<NetworkContext> result) {
          if (result.failed()) {
            log.error(result.cause());
            exceptionHandler.handle(new JsonObject().putString("exception", result.cause().toString()));
          }else {
            started = System.currentTimeMillis();
            context = result.result();
            startedHandler.handle(new JsonObject());
          }
        }
      });
    }

    public void shutdown(final Handler<JsonObject> stoppededHandler, final Handler<JsonObject> exceptionHandler) {
      if(context != null){
        vertigo.shutdownLocalNetwork(context, new Handler<AsyncResult<Void>>() {
          @Override
          public void handle(AsyncResult<Void> result) {
            double uptime = System.currentTimeMillis() - started;
            started = -1;
            context = null;
            if (result.failed()) {
              log.error(result.cause());
              exceptionHandler.handle(new JsonObject().putString("exception", result.cause().toString()));
            }else {
              stoppededHandler.handle(new JsonObject().putNumber("time", System.currentTimeMillis()).putNumber("uptime", uptime/1000));

              if(isRemoving)
                networks.remove(id);
            }
          }
        });
      }
    }

    public void remove(final Handler<JsonObject> stoppededHandler, final Handler<JsonObject> exceptionHandler){
      isRemoving = true;
      shutdown(stoppededHandler, exceptionHandler);
    }

    public boolean isRemoved(){
      return isRemoving;
    }
  }

  public VertigoInterface(Vertx vertx, Container container, Vertigo<?> vertigo) {
    super();
    this.vertx = vertx;
    this.container = container;
    this.log = container.logger();
    this.vertigo = vertigo;
  }

  public IVertigoDeployment deployment(JgGraph graph){

    Network network = new NetworkTranslator(graph).translate();
    JsonObject net_conf = 
        new JsonObject(SerializerFactory.getSerializer(Network.class).serializeToString(network));

    VertigoClientCommunication com = 
        new VertigoClientCommunication(net_conf);

    return com;
  }
}
