import * as THREE from 'three';

export class Node extends THREE.Group {
    constructor(nodeRadius, orbittingRadius, color, phase) {
        super();
        this._nodeRadius = nodeRadius;
        this._orbittingRadius = orbittingRadius;
        this._color = color;
        let circleGeometry = new THREE.CircleGeometry(nodeRadius, 12);
        let edges = new THREE.EdgesGeometry(circleGeometry);
        let lineMaterial = new THREE.LineBasicMaterial({ color });
        let lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        this._line = new THREE.Line(lineGeometry, lineMaterial);
        let circleFillMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        let circleFill = new THREE.Mesh(circleGeometry, circleFillMaterial);
        this._outline = new THREE.LineSegments(edges, lineMaterial);
        this._outline.position.z = 0.01;
        this._line.position.z = -0.01;
        this._line.visible = false;
        this._phase = phase;
        this._inFocus = false;
        this.add(this._line);
        this.add(circleFill);
        this.add(this._outline);
    }

    get nodeRadius() {
        return this._nodeRadius;
    }

    get orbittingRadius() {
        return this._orbittingRadius;
    }

    get color() {
        return this._color;
    }

    set color(hex) {
        this._color = hex;
        //this._outline.material.color.setHex(hex);
        //this._line.material.color.setHex(hex);
    }

    get inFocus() {
        return this._inFocus;
    }

    set inFocus(inFocus) {
        if (this._inFocus !== inFocus) {
            this._inFocus = inFocus;
            if (inFocus)
                this._outline.material.color.setHex(0xffffff);
            else
                this._outline.material.color.setHex(this._color);
        }
    }

    updatePhase(movement = 0) {
        let updatedPhase = this._phase + movement;

        if (updatedPhase >= 2 * Math.PI) {
            updatedPhase = 0;
        }
        else if (updatedPhase <= 0) {
            updatedPhase = 2 * Math.PI;
        }

        this._phase = updatedPhase;
    }

    mark(mark) {
        this._line.visible = mark;
    }

    updatePosition() {
        let x = this._orbittingRadius * Math.cos(this._phase);
        let y = this._orbittingRadius * Math.sin(this._phase);
        this.position.x = x;
        this.position.y = y;
        let vec = new THREE.Vector2(x, y);
        vec.normalize();
        vec.multiplyScalar(50);
        this._line.geometry.verticesNeedUpdate = true;
        this._line.geometry.vertices[0].set(-vec.x, -vec.y, 0);
    }
}

export class Orbit extends THREE.Group {
    constructor(radius, color) {
        super();
        this._radius = radius;
        this._color = color;
        let circleGeometry = new THREE.CircleGeometry(radius, 32);
        let edges = new THREE.EdgesGeometry(circleGeometry);
        let lineMaterial = new THREE.LineBasicMaterial({ color });
        this._outline = new THREE.LineSegments(edges, lineMaterial);
        this._inFocus = false;
        this._mark = false;
        this.add(this._outline);
        this._nodes = [];
        this._velocity = 0;
        this._acceleration = 0;
    }

    get radius() {
        return this._radius;
    }

    get color() {
        return this._color;
    }

    set color(hex) {
        this._color = hex;
        this._outline.material.color.setHex(hex);
    }

    get inFocus() {
        return this._inFocus;
    }

    set inFocus(inFocus) {
        if (this._inFocus !== inFocus) {
            this._inFocus = inFocus;
            this._nodes.forEach(node => { node.inFocus = inFocus; });
            if (inFocus)
                this._outline.material.color.setHex(0xffffff);
            else
                this._outline.material.color.setHex(this._color);
            this._acceleration = 0;
        }
    }

    get acceleration() {
        return this._acceleration;
    }

    set acceleration(acc) {
        this._acceleration = acc;
        console.log(acc)
    }

    addNode(phase = 0) {
        let node = new Node(20, this._radius, Math.random() * 0xffffff, phase);
        this._nodes.push(node);
        this.add(node);
    }

    randomizeNodePhases() {
        this._nodes.forEach(node => { node._phase = Math.PI * 2 * Math.random() });
    }

    randomizeNodeColors() {
        this._nodes.forEach(node => { node.color = Math.random() * 0xffffff });
    }

    updateNodePositions() {
        this._nodes.forEach(node => { node.updatePosition(); });
    }

    toggleMark() {
        this._mark = !this._mark;
        this._nodes.forEach(node => { node.mark(this._mark); });
    }

    update() {
        if (this._acceleration !== 0) {
            if (Math.abs(this._velocity) < 100)
                this._velocity += this._acceleration;
        }
        else if (Math.abs(this._velocity) >= 0.1) {
            this._velocity += 0.1 * (-this._velocity / Math.abs(this._velocity));
        }
        else
            this._velocity = 0;
        this._nodes.forEach(node => {
            node.updatePhase(this._velocity / (Math.PI * this._radius));
            node.updatePosition();
        });
    }
}

export class System extends THREE.Group {
    constructor(levels) {
        super();
        this._orbits = [];
        for (let i = 1; i <= levels; i++) {
            let orbit = new Orbit(i * 50, Math.random() * 0xffffff);
            let nodeCount = Math.floor(Math.random() * 3) + 1;
            for (let j = 1; j <= nodeCount; j++) {
                orbit.addNode(Math.PI * 2 * Math.random());
            }
            orbit.update();
            this._orbits.push(orbit);
            this.add(orbit);
        }

        this._orbitInFocus = null;
    }

    updateFocus(dif) {
        let newFocus = this._orbitInFocus + dif;
        if (newFocus < 0)
            newFocus = 0;
        else if (newFocus >= this._orbits.length)
            newFocus = this._orbits.length - 1;

        this.focus = newFocus;
    }

    get focus() {
        return this._orbitInFocus;
    }

    set focus(newFocus) {
        if (newFocus >= 0 && newFocus < this._orbits.length) {
            this._orbitInFocus = newFocus;
            this._orbits.forEach(orbit => {
                orbit.inFocus = false;
            });
            this._orbits[this._orbitInFocus].inFocus = true;
        }
    }

    toggleMark() {
        this._orbits[this._orbitInFocus].toggleMark();
    }

    accelerate(acc) {
        this._orbits[this._orbitInFocus].acceleration = acc;
    }

    randomise() {
        this._orbits.forEach(orbit => {
            orbit.color = Math.random() * 0xffffff;
            orbit.randomizeNodeColors();
            orbit.randomizeNodePhases();
            orbit.updateNodePositions();
        });
    }

    update() {
        this._orbits.forEach(orbit => {
            orbit.update();
        });
    }
}