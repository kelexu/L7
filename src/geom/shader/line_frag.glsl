    precision highp float;
    varying vec4 v_color;
    varying float vTime;
    void main() {
      vec4 color = v_color;
  
      #ifdef ANIMATE 
        if (vTime > 1.0 || vTime < 0.0) {
            discard;
      } 
      color.a= color.a * vTime * 1.5;
      #endif
      gl_FragColor = color;
        #pragma include "pick"
}