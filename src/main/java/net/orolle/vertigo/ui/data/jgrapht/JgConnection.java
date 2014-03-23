package net.orolle.vertigo.ui.data.jgrapht;

import org.jgrapht.graph.DefaultEdge;

public class JgConnection extends DefaultEdge {
  private static final long serialVersionUID = -2368004628697798986L;

  final private JgComponent v1, v2;
  final private String in, out;

  public JgConnection(JgComponent v1, String out, JgComponent v2, String in) {
    this.v1 = v1;
    this.v2 = v2;
    this.in = in;
    this.out = out;
  }

  public JgComponent getV1() {
    return v1;
  }

  public String getV1Port() {
    return out;
  }

  public JgComponent getV2() {
    return v2;
  }

  public String getV2Port() {
    return in;
  }

  public String toString() {
    return "("+v1+"-"+out+" -> "+v2+"-"+in+")";
  }
}
