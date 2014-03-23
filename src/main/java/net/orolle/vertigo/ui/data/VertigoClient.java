package net.orolle.vertigo.ui.data;

import net.kuujo.vertigo.Vertigo;
import net.kuujo.vertigo.context.NetworkContext;
import net.kuujo.vertigo.java.VertigoVerticle;
import net.kuujo.vertigo.network.Network;
import net.orolle.vertigo.ui.util.FutureAdapter;

import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.Future;
import org.vertx.java.core.Handler;

public class VertigoClient extends VertigoVerticle {
  
  private Vertigo<?> vertigo;
  
  @Override
  public void start(final Future<Void> future) {
    super.start(new FutureAdapter<Void>());
    this.vertigo = ((Vertigo<?>)super.vertigo);
    
    Network network = Network.fromJson(container.config().getObject("network"));
    vertigo.deployLocalNetwork(network, new Handler<AsyncResult<NetworkContext>>() {
      @Override
      public void handle(AsyncResult<NetworkContext> result) {
        if (result.failed()) {
          container.logger().error(result.cause());
          future.setFailure(result.cause());
        }else {
          final NetworkContext context = result.result();
          vertx.setTimer(5000, new Handler<Long>() {
            @Override
            public void handle(Long timerID) {
              vertigo.shutdownLocalNetwork(context, new Handler<AsyncResult<Void>>() {
                @Override
                public void handle(AsyncResult<Void> event) {
                  future.setResult(null);
                }
              });
            }
          });
        }
      }
    });
  }
}
