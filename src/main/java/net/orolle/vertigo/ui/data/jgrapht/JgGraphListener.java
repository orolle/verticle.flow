package net.orolle.vertigo.ui.data.jgrapht;

import org.jgrapht.event.GraphListener;

public interface JgGraphListener extends GraphListener<JgComponent, JgConnection>{
  public void componentChanged(JgGraphComponentChangeEvent e);
  public void graphChanged(JgGraphChangeEvent e);
}