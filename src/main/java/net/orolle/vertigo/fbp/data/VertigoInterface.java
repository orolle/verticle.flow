package net.orolle.vertigo.fbp.data;

import org.vertx.java.core.Vertx;
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
  
}
