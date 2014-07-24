package net.orolle.vertigo.verticleflow;

import java.io.File;
import java.util.List;

import net.orolle.vertigo.verticleflow.translate.NoderedToVertigo;
import net.orolle.vertigo.verticleflow.translate.VertigoToNodered;
import net.orolle.vertigo.verticleflow.util.Tool;

import org.vertx.java.busmods.BusModBase;
import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.Future;
import org.vertx.java.core.Handler;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;


/**
 * Vertigo UI BusModule. 
 * Loads the webserver, websocket, vertigo and flow based programming apis.
 * 
 * @author Oliver Rolle
 *
 */
public class Main extends BusModBase {
  private VertigoMavenLoader loader;
  private VertigoManager vertigo;
  
  @Override
  public void start(final Future<Void> startedResult) {
    super.start();
    String vertigoCluster = this.config.getString("cluster", null);
    
    if (vertigoCluster == null) {
      vertigoCluster = "verticle.flow-cluster";
      deployVertigo(vertigoCluster);
    }
    
    loader = new VertigoMavenLoader(getVertx(), this.config.getString("maven", System.getProperty("user.home")+File.separator+".m2"))
    .reload();
    vertigo = new VertigoManager(getVertx(), getContainer(), vertigoCluster);
    
    final JsonObject webConfig = new JsonObject()
    .putString("host", this.config.getString("host", "127.0.0.1"))
    .putNumber("port", this.config.getInteger("port", 3111))
    .putString("web_root", "web")
    .putBoolean("static_files", true)
    .putBoolean("bridge", true)
    .putArray("inbound_permitted", new JsonArray().add(new JsonObject().putString("address_re", "web.in\\..+")
        .putBoolean("requires_auth", false)))
    .putArray("outbound_permitted", new JsonArray().add(new JsonObject().putString("address_re", "web.out\\..+")
        .putBoolean("requires_auth", false)))
    .putObject("sjs_config", new JsonObject().putString("prefix", "/vertxbus"));
    
    container.deployModule("io.vertx~mod-web-server~2.0.0-final", webConfig, 1, new Handler<AsyncResult<String>>() {
      @Override
      public void handle(AsyncResult<String> event) {
        System.out.println("Webserver listens on "+webConfig.getString("host")+":"+webConfig.getInteger("port"));
        startedResult.setResult(null);
      }
    });
    
    /*
     * UI Interaction
     */
    
    vertx.eventBus().registerHandler("web.in.component.names", new Handler<Message<JsonObject>>() {
      @Override
      public void handle(Message<JsonObject> msg) {
        msg.reply(Tool.listToJson(loader.getComponentNames()));
      }
    });
    
    vertx.eventBus().registerHandler("web.in.component.html", new Handler<Message<JsonObject>>() {
      @Override
      public void handle(Message<JsonObject> msg) {
        String html = loader.getComponentHtml(msg.body().getString("moduleId", null));
        if(html != null) {
          msg.reply(html);
        }
      }
    });
    
    vertx.eventBus().registerHandler("web.in.flows.load", new Handler<Message<JsonObject>>() {
      @Override
      public void handle(final Message<JsonObject> msg) {
        vertigo.activeNetworks(new Handler<List<JsonObject>>() {
          @Override
          public void handle(List<JsonObject> networks) {
            JsonArray json = networks.size() > 0? new VertigoToNodered(networks).translate() :
              ! new File("stored-networks.json").exists()? new JsonArray() :
                  new JsonArray(vertx.fileSystem().readFileSync("stored-networks.json").toString());
              
            msg.reply(json);
          }
        });
      }
    });
    
    vertx.eventBus().registerHandler("web.in.flows.deploy", new Handler<Message<JsonArray>>() {
      @Override
      public void handle(final Message<JsonArray> msg) {
        String flows = msg.body().encodePrettily();
        vertx.fileSystem().writeFileSync("stored-networks.json", new Buffer(flows));
        
        List<JsonObject> nets = new NoderedToVertigo(new JsonArray(flows)).translate();
        
        for(JsonObject network : nets) {
          vertigo.deploy(network);
        }
        
        msg.reply();
      }
    });
  }

  private void deployVertigo(String cluster) {
    //vertx.fileSystem().mkdirSync("mods"); // stores modules
    System.out.println("No vertigo cluster adress given: Deploy one on '"+cluster+"'");
    
    JsonObject vertigo_config = new JsonObject()
    .putString("cluster", cluster);
    
    container.deployModule("net.kuujo~vertigo-cluster~0.7.0-RC2", vertigo_config);
  }
}
