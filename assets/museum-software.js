// Small Canvas2D fallback: projects the same scene geometry when WebGL is unavailable.
import * as T from './three.module.min.js';
export class MuseumSoftwareRenderer {
 constructor(){this.domElement=document.createElement('canvas');this.ctx=this.domElement.getContext('2d');this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>1};this.ratio=1;this.width=1;this.height=1;this.light=new T.Vector3(-.35,.8,.6).normalize();this.cache=new WeakMap();}
 setPixelRatio(r){this.ratio=Math.min(r,1.4);}
 setSize(w,h){this.width=w;this.height=h;this.domElement.width=Math.round(w*this.ratio);this.domElement.height=Math.round(h*this.ratio);}
 render(scene,camera){
 const c=this.ctx,w=this.width,h=this.height;c.setTransform(this.ratio,0,0,this.ratio,0,0);c.clearRect(0,0,w,h);scene.updateMatrixWorld();camera.updateMatrixWorld();
 const vp=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),faces=[],pos=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),normal=new T.Vector3(),nm=new T.Matrix3();
 // Soft ground contact shadow, independent of GPU shadow maps.
 const ground=new T.Vector3(0,.04,0).applyMatrix4(vp);c.save();c.translate((ground.x+1)*w/2,(1-ground.y)*h/2);c.scale(1,.23);const grad=c.createRadialGradient(0,0,10,0,0,w*.30);grad.addColorStop(0,'rgba(100,53,76,.16)');grad.addColorStop(1,'rgba(100,53,76,0)');c.fillStyle=grad;c.fillRect(-w*.35,-w*.35,w*.70,w*.70);c.restore();
 scene.traverse(o=>{if(!o.isMesh||!o.visible||o.material.isShadowMaterial)return;const g=o.geometry,m=o.material;if(Array.isArray(m))return;const p=g.attributes.position,idx=g.index?.array,uv=g.attributes.uv,n=(idx?idx.length:p.count),world=[],project=[];nm.getNormalMatrix(o.matrixWorld);
 for(let i=0;i<p.count;i++){pos.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);world.push(pos.clone());pos.applyMatrix4(vp);project.push([(pos.x+1)*w/2,(1-pos.y)*h/2,pos.z]);}
 for(let j=0;j<n;j+=3){const ids=idx?[idx[j],idx[j+1],idx[j+2]]:[j,j+1,j+2],v=ids.map(i=>project[i]);if(v.some(q=>q[2]<-1||q[2]>1))continue;const cross=(v[1][0]-v[0][0])*(v[2][1]-v[0][1])-(v[1][1]-v[0][1])*(v[2][0]-v[0][0]);if(m.side!==T.DoubleSide&&cross>=0)continue;if(Math.abs(cross)<.07)continue;a.subVectors(world[ids[1]],world[ids[0]]);b.subVectors(world[ids[2]],world[ids[0]]);normal.crossVectors(a,b).normalize();let shade=m.isMeshBasicMaterial?1:.68+.28*Math.max(0,normal.dot(this.light));const color=m.color.clone().convertLinearToSRGB();const rgb=[color.r,color.g,color.b].map(x=>Math.round(Math.min(1,x*shade)*255));faces.push({v,z:(v[0][2]+v[1][2]+v[2][2])/3,color:`rgb(${rgb.join(',')})`,alpha:m.opacity??1,wire:m.wireframe,img:m.map?.image,uv:uv&&m.map?ids.map(i=>[uv.getX(i),1-uv.getY(i)]):null});}
 });faces.sort((a,b)=>b.z-a.z);
 for(const f of faces){const v=f.v;c.globalAlpha=f.alpha;c.beginPath();c.moveTo(v[0][0],v[0][1]);c.lineTo(v[1][0],v[1][1]);c.lineTo(v[2][0],v[2][1]);c.closePath();if(f.wire){c.strokeStyle=f.color;c.lineWidth=.7;c.stroke();continue;}if(f.img&&f.uv){const im=f.img,uv=f.uv.map(q=>[q[0]*im.width,q[1]*im.height]),[s0,s1,s2]=uv,[d0,d1,d2]=v;const den=(s1[0]-s0[0])*(s2[1]-s0[1])-(s2[0]-s0[0])*(s1[1]-s0[1]);if(Math.abs(den)>.00001){const A=((d1[0]-d0[0])*(s2[1]-s0[1])-(d2[0]-d0[0])*(s1[1]-s0[1]))/den;const B=((d1[1]-d0[1])*(s2[1]-s0[1])-(d2[1]-d0[1])*(s1[1]-s0[1]))/den;const C=((s1[0]-s0[0])*(d2[0]-d0[0])-(s2[0]-s0[0])*(d1[0]-d0[0]))/den;const D=((s1[0]-s0[0])*(d2[1]-d0[1])-(s2[0]-s0[0])*(d1[1]-d0[1]))/den;c.save();c.clip();c.transform(A,B,C,D,d0[0]-A*s0[0]-C*s0[1],d0[1]-B*s0[0]-D*s0[1]);c.drawImage(im,0,0);c.restore();continue;}}
 c.fillStyle=f.color;c.fill();c.strokeStyle=f.color;c.lineWidth=.35;c.stroke();}c.globalAlpha=1;
 }
}
