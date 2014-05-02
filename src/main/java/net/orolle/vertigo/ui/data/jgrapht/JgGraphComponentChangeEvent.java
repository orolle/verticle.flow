package net.orolle.vertigo.ui.data.jgrapht;

import java.util.EventObject;

public class JgGraphComponentChangeEvent extends EventObject{
  public final JgComponent component;
  
  public JgGraphComponentChangeEvent(JgComponent source) {
    super(source);
    this.component = source;
  }

  private static final long serialVersionUID = 1529983939555836539L;
  
}
