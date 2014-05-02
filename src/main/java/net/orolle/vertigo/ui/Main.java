package net.orolle.vertigo.ui;

import net.kuujo.vertigo.java.VertigoVerticle;
import net.orolle.vertigo.ui.data.FbpEnvironment;
import net.orolle.vertigo.ui.data.FbpUser;
import net.orolle.vertigo.ui.data.VertigoInterface;
import net.orolle.vertigo.ui.webserver.VertigoUiWebserver;

import org.vertx.java.busmods.BusModBase;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.ServerWebSocket;
import org.vertx.java.core.json.JsonObject;

/**
 * Vertigo UI BusModule. 
 * Loads the webserver, websocket, vertigo and flow based programming apis.
 * 
 * @author Oliver Rolle
 *
 */
public class Main extends VertigoVerticle {  

  @Override
  public void start() {
    super.start();
    
    final VertigoInterface vertigoRuntime = new VertigoInterface(getVertx(), getContainer(), vertigo);
    final FbpEnvironment fbpRuntime = new FbpEnvironment(vertigoRuntime);

    JsonObject web_config = new JsonObject()
    .putNumber("port", 3111)
    .putString("host", "0.0.0.0")
    .putString("web_root", "./web")
    .putString("index_page", "index.html")
    .putBoolean("static_files", true);

    new VertigoUiWebserver(getVertx(), web_config, new Handler<ServerWebSocket>() {
      @Override
      public void handle(ServerWebSocket ws) {
        new FbpUser(fbpRuntime, ws);
      }
    });
  }
}
