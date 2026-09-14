class V3 { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z} set(...a){Object.assign(this,{x:a[0],y:a[1],z:a[2]})} setScalar(){} copy(){} add(){} lerp(){} }
class Col { constructor(c){this.c=c} set(){} copy(){} lerp(){} }
class Geo { setAttribute(){} setIndex(){} dispose(){} computeBoundingSphere(){} }
class Obj {}
export const Vector2 = V3, Vector3 = V3, Color = Col, Object3D = Obj
export const BufferGeometry = Geo, Sphere = class {}, Plane = class {}
export const BufferAttribute = class { constructor(a,i){this.array=a;this.itemSize=i;this.needsUpdate=false} }
export const ShaderMaterial = class { constructor(o){Object.assign(this,{uniforms:{}},o)} dispose(){} }
export const MeshBasicMaterial = class {}, MeshStandardMaterial = class {}, LineBasicMaterial = class {}, PointsMaterial = class {}
export const TextureLoader = class { setCrossOrigin(){} load(a,b,c,d){ return { dispose(){}, image: null } } }
export const CanvasTexture = class { constructor(){this.colorSpace='';this.generateMipmaps=true} dispose(){} }
export const AdditiveBlending = 2, DoubleSide = 2, LinearFilter = 1006, NearestFilter = 1003
export const LinearMipmapLinearFilter = 1008, SRGBColorSpace = 'srgb', NoToneMapping = 0
export class Points extends Obj {}
export class Group extends Obj { constructor(){super();this.rotation={x:0,y:0,z:0};this.scale={setScalar(){}};this.position={set(){}};this.visible=true} }
export class Mesh extends Obj {}
export class LineSegments extends Obj {}
export class IcosahedronGeometry extends Geo {}
export class EdgesGeometry extends Geo {}
export class TubeGeometry extends Geo {}
export class CatmullRomCurve3 { constructor(){this.points=[]} getPointAt(){return new V3()} getPoint(){return new V3()} }
export const MathUtils = { clamp:(v,a,b)=>Math.max(a,Math.min(b,v)), lerp:(a,b,t)=>a+(b-a)*t, smoothstep:()=>0 }
export const SphereGeometry = class {}, RingGeometry = class {}, PlaneGeometry = class {}
export default { Vector3: V3 }
