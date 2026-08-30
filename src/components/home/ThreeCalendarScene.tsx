"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
    context.closePath();
}

function createCalendarTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 620;
    const context = canvas.getContext("2d");

    if (context == null) return new THREE.CanvasTexture(canvas);

    context.clearRect(0, 0, canvas.width, canvas.height);
    roundedRect(context, 18, 18, 864, 584, 42);
    context.fillStyle = "rgba(255, 253, 250, 0.88)";
    context.fill();
    context.strokeStyle = "rgba(198, 60, 51, 0.24)";
    context.lineWidth = 3;
    context.stroke();

    context.fillStyle = "#20222a";
    context.font = "600 45px sans-serif";
    context.fillText("2026.09", 76, 108);
    context.fillStyle = "rgba(32, 34, 42, 0.58)";
    context.font = "500 24px sans-serif";

    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    weekdays.forEach((day, index) => context.fillText(day, 84 + index * 108, 172));

    const start = 3;
    for (let day = 1; day <= 30; day += 1) {
        const index = start + day - 1;
        const column = index % 7;
        const row = Math.floor(index / 7);
        const x = 88 + column * 108;
        const y = 245 + row * 82;

        if (day === 19) {
            context.beginPath();
            context.arc(x + 8, y - 8, 34, 0, Math.PI * 2);
            context.fillStyle = "#c63c33";
            context.fill();
            context.fillStyle = "#ffffff";
        } else {
            context.fillStyle = "#20222a";
        }

        context.font = "600 31px sans-serif";
        context.fillText(String(day), x - 10, y + 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
}

function createOrbit(radiusX: number, radiusZ: number, offset: number, color: number) {
    const points: THREE.Vector3[] = [];
    for (let index = 0; index <= 180; index += 1) {
        const theta = (index / 180) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radiusX, Math.sin(theta * 1.5 + offset) * 0.15, Math.sin(theta) * radiusZ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 });
    return new THREE.Line(geometry, material);
}

export default function ThreeCalendarScene() {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        if (root == null) return;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        root.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
        camera.position.set(0, 0.1, 10);

        const world = new THREE.Group();
        world.position.set(0.25, -0.25, 0);
        world.rotation.set(-0.18, -0.48, 0.08);
        scene.add(world);

        const ambient = new THREE.AmbientLight(0xffffff, 1.9);
        const keyLight = new THREE.PointLight(0xff836d, 42, 22);
        keyLight.position.set(3.6, 4.4, 5);
        const fillLight = new THREE.PointLight(0x97a8ff, 24, 18);
        fillLight.position.set(-4.5, -0.8, 3);
        scene.add(ambient, keyLight, fillLight);

        const texture = createCalendarTexture();
        const panelPositions = [
            { x: 0, y: 0, z: 0.15, rotation: 0 },
            { x: 0.58, y: 0.4, z: -0.44, rotation: 0.12 },
            { x: -0.62, y: -0.34, z: -0.68, rotation: -0.12 },
        ];

        panelPositions.forEach((panel, index) => {
            const material = new THREE.MeshPhysicalMaterial({
                map: texture,
                transparent: true,
                opacity: index === 0 ? 0.92 : 0.38,
                roughness: 0.18,
                metalness: 0.05,
                transmission: 0.08,
                side: THREE.DoubleSide,
            });
            const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 3.72), material);
            plane.position.set(panel.x, panel.y, panel.z);
            plane.rotation.z = panel.rotation;
            world.add(plane);
        });

        const orbits = [
            createOrbit(3.9, 1.8, 0.2, 0xc63c33),
            createOrbit(4.3, 2.3, 1.2, 0xf3a79f),
            createOrbit(3.1, 2.75, 2.4, 0x93a7ff),
        ];
        orbits[1].rotation.x = 0.48;
        orbits[2].rotation.y = 0.7;
        world.add(...orbits);

        const markerGeometry = new THREE.SphereGeometry(0.15, 28, 28);
        const markerMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc63c33, roughness: 0.2, metalness: 0.2 });
        const pearlMaterial = new THREE.MeshPhysicalMaterial({ color: 0xfff8f3, roughness: 0.08, metalness: 0.18 });
        const markers = [
            { position: [3.35, 0.9, 0.3], material: markerMaterial, size: 1.32 },
            { position: [-2.7, -1.2, 0.62], material: markerMaterial, size: 0.78 },
            { position: [1.6, -1.7, 0.8], material: pearlMaterial, size: 0.92 },
            { position: [-1.2, 1.65, 0.4], material: pearlMaterial, size: 0.58 },
        ];
        markers.forEach(({ position, material, size }) => {
            const marker = new THREE.Mesh(markerGeometry, material);
            marker.position.set(position[0], position[1], position[2]);
            marker.scale.setScalar(size);
            world.add(marker);
        });

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let pointerX = 0;
        let pointerY = 0;
        let frameId = 0;

        const onPointerMove = (event: PointerEvent) => {
            const bounds = root.getBoundingClientRect();
            pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
            pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
        };

        const resize = () => {
            const { width, height } = root.getBoundingClientRect();
            if (width === 0 || height === 0) return;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
        };

        const render = () => {
            frameId = window.requestAnimationFrame(render);
            world.rotation.y += (pointerX * 0.2 - world.rotation.y - 0.48) * 0.035;
            world.rotation.x += (-0.18 + pointerY * 0.09 - world.rotation.x) * 0.035;
            world.rotation.z = 0.08 + Math.sin(Date.now() * 0.00055) * 0.025;
            orbits[0].rotation.z += 0.002;
            orbits[1].rotation.z -= 0.0015;
            orbits[2].rotation.z += 0.001;
            renderer.render(scene, camera);
        };

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(root);
        root.addEventListener("pointermove", onPointerMove, { passive: true });
        resize();

        if (prefersReducedMotion) {
            renderer.render(scene, camera);
        } else {
            render();
        }

        return () => {
            window.cancelAnimationFrame(frameId);
            root.removeEventListener("pointermove", onPointerMove);
            resizeObserver.disconnect();
            texture.dispose();
            markerGeometry.dispose();
            markerMaterial.dispose();
            pearlMaterial.dispose();
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
                    object.geometry.dispose();
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    materials.forEach((material) => material.dispose());
                }
            });
            renderer.dispose();
            renderer.domElement.remove();
        };
    }, []);

    return <div ref={rootRef} className="h-full w-full" aria-hidden="true" />;
}
