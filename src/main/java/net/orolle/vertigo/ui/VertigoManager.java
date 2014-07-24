package net.orolle.vertigo.ui;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.Handler;
import org.vertx.java.core.Vertx;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.platform.Container;
import org.vertx.java.platform.impl.DefaultPlatformManager;

public class VertigoManager {
  private final Vertx vertx;
  private final Container container;
  private final String vAddress;
  private DefaultPlatformManager deployManager;

  public VertigoManager(Vertx vertx, Container container, String addr) {
    super();
    this.vertx = vertx;
    this.container = container;
    this.vAddress = addr;

    Field f;
    try {
      f = this.container.getClass().getDeclaredField("mgr");
      f.setAccessible(true);
      deployManager = (DefaultPlatformManager) f.get(container);
    } catch (NoSuchFieldException | SecurityException e) {
      e.printStackTrace();
    } catch (IllegalArgumentException e) {
      e.printStackTrace();
    } catch (IllegalAccessException e) {
      e.printStackTrace();
    }

  }

  public void activeNetworks(final Handler<List<JsonObject>> h){
    vertx.eventBus().send(vAddress, new JsonObject()
    .putString("action", "list").putString("type", "network"), new Handler<Message<JsonObject>>() {
      @Override
      public void handle(Message<JsonObject> reply) {
        List<JsonObject> res = new ArrayList<>();

        if (reply.body().getString("status").equals("ok")) {
          JsonArray networks = reply.body().getArray("result");
          for (Object object : networks) {
            if (object instanceof JsonObject) {
              JsonObject jNet = (JsonObject) object;
              res.add(jNet);
            }
          }
        }
        
        h.handle(res);
      }
    });
  }

  public void deploy(JsonObject network) {
    JsonObject deploy = new JsonObject()
    .putString("action", "deploy")
    .putString("type", "network")
    .putObject("network", network);

    for (String id : network.getObject("components").getFieldNames()) {
      final String moduleId = network.getObject("components").getObject(id).getString("module");
      
      deployManager.installModule(moduleId, new Handler<AsyncResult<Void>>() {
        @Override
        public void handle(AsyncResult<Void> event) {
          System.out.println("Install "+moduleId+"? "+event.succeeded());
        }
      });
    }

    vertx.eventBus().send(vAddress, deploy);

    System.out.println("DEPLOY: " + deploy.encodePrettily());
  }

  public void shutdown(JsonObject network) {
    JsonObject undeploy = new JsonObject()
    .putString("action", "undeploy")
    .putString("type", "network")
    .putString("network", network.getString("name"));

    vertx.eventBus().send(vAddress, undeploy);

    System.out.println("UNDEPLOY: " + undeploy.encodePrettily());
  }
}
