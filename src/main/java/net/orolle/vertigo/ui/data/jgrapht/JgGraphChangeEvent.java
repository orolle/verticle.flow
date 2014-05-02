package net.orolle.vertigo.ui.data.jgrapht;

import java.util.EventObject;

public class JgGraphChangeEvent extends EventObject {
  public final JgGraph graph;
  
  public JgGraphChangeEvent(JgGraph graph) {
    super(graph);
    this.graph = graph;
  }

  /**
   * 
   */
  private static final long serialVersionUID = 3287063966356978301L;

}
