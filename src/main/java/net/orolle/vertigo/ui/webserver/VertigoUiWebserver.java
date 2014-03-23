package net.orolle.vertigo.ui.webserver;

import java.io.File;

import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.AsyncResultHandler;
import org.vertx.java.core.Future;
import org.vertx.java.core.Handler;
import org.vertx.java.core.Vertx;
import org.vertx.java.core.http.HttpServer;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.http.RouteMatcher;
import org.vertx.java.core.http.ServerWebSocket;
import org.vertx.java.core.json.JsonObject;

public class VertigoUiWebserver {

  public static final int DEFAULT_PORT = 80;

  public static final String DEFAULT_ADDRESS = "0.0.0.0";

  public static final String DEFAULT_WEB_ROOT = "web";

  public static final String DEFAULT_INDEX_PAGE = "index.html";

  public static final String DEFAULT_AUTH_ADDRESS = "vertx.basicauthmanager.authorise";

  public static final long DEFAULT_AUTH_TIMEOUT = 5 * 60 * 1000;
  
  public final Vertx vertx;
  public final JsonObject config;
  
  public VertigoUiWebserver(final Vertx vertx, final JsonObject config, final Handler<ServerWebSocket> wsHandler) {
    this(vertx, config, wsHandler, null);
  }

  public VertigoUiWebserver(final Vertx vertx, final JsonObject config, final Handler<ServerWebSocket> wsHandler, final Future<Void> result) {
    this.vertx = vertx;
    this.config = config;

    HttpServer server = vertx.createHttpServer();

    if (config.getBoolean("ssl", false)) {
      server.setSSL(true).setKeyStorePassword(config.getString("key_store_password", "wibble"))
      .setKeyStorePath(config.getString("key_store_path", "server-keystore.jks"));
    }

    if (config.getBoolean("route_matcher", false)) {
      server.requestHandler(routeMatcher());
    }
    else if (config.getBoolean("static_files", true)) {
      server.requestHandler(staticHandler());
    }

    server.websocketHandler(new Handler<ServerWebSocket>() {
      @Override
      public void handle(ServerWebSocket ws) {
        if("/fbpnp".equals(ws.path()))
          wsHandler.handle(ws);
      }
    });

    server.listen(config.getNumber("port", DEFAULT_PORT).intValue(), config.getString("host", DEFAULT_ADDRESS), new AsyncResultHandler<HttpServer>() {
      @Override
      public void handle(AsyncResult<HttpServer> ar) {
        if(result == null)
          return;
        
        if (!ar.succeeded()) {
          result.setFailure(ar.cause());
        } else {
          result.setResult(null);
        }
      }
    });
  }

  /**
   * @return RouteMatcher
   */
  protected RouteMatcher routeMatcher() {
    RouteMatcher matcher = new RouteMatcher();
    matcher.noMatch(staticHandler());
    return matcher;
  }

  /**
   * @return Handler for serving static files
   */
  protected Handler<HttpServerRequest> staticHandler() {
    String webRoot = config.getString("web_root", DEFAULT_WEB_ROOT);
    String index = config.getString("index_page", DEFAULT_INDEX_PAGE);
    String webRootPrefix = webRoot + File.separator;
    String indexPage = webRootPrefix + index;
    boolean gzipFiles = config.getBoolean("gzip_files", false);
    boolean caching = config.getBoolean("caching", false);

    return new StaticFileHandler(vertx, webRootPrefix, indexPage, gzipFiles, caching);
  }
}
