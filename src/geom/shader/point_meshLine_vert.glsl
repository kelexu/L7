precision highp float;
attribute float a_miter;
attribute vec3 a_size;
attribute vec3 a_shape;
uniform float u_strokeWidth;
uniform float u_strokeOpacity;
uniform vec4 u_activeColor;
uniform float u_activeId;
uniform vec4 u_stroke;
uniform float u_zoom;
uniform float u_time;
varying float vTime;
varying float v_pickingId;
varying vec4 v_color;
void main() {
 mat4 matModelViewProjection = projectionMatrix * modelViewMatrix;
 float scale = pow(2.0,(20.0 - u_zoom));
 vec3 newposition = position + (a_size + vec3(u_strokeWidth/2.,u_strokeWidth/2.,0)) * scale* a_shape + vec3(0., a_size.y * scale / 4., 0.);;
   #ifdef ANIMATE 
        vTime = 1.0- (mod(u_time*50.,3600.)- position.z) / 100.;
   #endif
v_color = u_stroke;
v_color.a *= u_strokeOpacity;

 v_pickingId = pickingId;
if(v_pickingId == u_activeId) {
     v_color = u_activeColor;
}

 //vec3 pointPos = newposition.xyz + vec3(normal * u_strokeWidth * pow(2.0,20.0-u_zoom) / 2.0 * a_miter);
 vec3 pointPos = newposition.xyz + vec3(normal * u_strokeWidth * scale / 2.0 * a_miter);
 gl_Position = matModelViewProjection * vec4(pointPos, 1.0);
#ifdef PICK
worldId = id_toPickColor(pickingId);
#endif

}