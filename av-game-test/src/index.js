import * as THREE from 'three';

export class Dot {
    constructor() {
        this.geometry = new THREE.SphereBufferGeometry(5, 32, 32);
        this.material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }
}

export class PointCloud {
    constructor() {
        this.geometry = new THREE.Geometry();
        this.material = new THREE.PointsMaterial({ color: 0xffff00, size: 5 });
        this.mesh = new THREE.Points(this.geometry, this.material);
    }

    addPoint(x, y, z) {
        this.geometry.vertices.push(new THREE.Vector3(x, y, z));
    }

    clear() {
        this.geometry.verticesNeedUpdate = true;
        this.geometry.vertices.length = 0;
    }
}


export class Renderer {
    constructor() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);//(0xe5e5dc);
        this.camera = new THREE.OrthographicCamera(width / -16, width / 16, height / 16, height / -16, 1, 2000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(width, height);
        this.camera.position.z = 70;
        //this.pointLight = new THREE.PointLight(0xffffff, 1, 500);
        //this.pointLight.position.set(50, 50, 50);
        //this.ambientLight = new THREE.AmbientLight(0x999999); // soft white light
        //this.scene.add(this.ambientLight);
        //this.scene.add(this.pointLight);
        //let geometry = new THREE.BoxBufferGeometry(45, 45, 45);
        //let edges = new THREE.EdgesGeometry(geometry);
        //let line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xbfbfb3 }));
        //this.scene.add(line);
        document.body.appendChild(this.renderer.domElement);
    }

    add(obj) {
        this.scene.add(obj.mesh);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

let render = new Renderer();
let cloud = new PointCloud();
for(let i = 0; i < 50000; i++) {
    cloud.addPoint(Math.random()*100 - 50, Math.random()*100 - 50, Math.random()*100 - 50);
}
render.add(cloud);
render.render();


let animate = function () {
    requestAnimationFrame(animate);
    cloud.clear();
    for(let i = 0; i < 50000; i++) {
        cloud.addPoint(Math.random()*100 - 50, Math.random()*100 - 50, Math.random()*100 - 50);
    } 
    render.render();
};

animate();