import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function StepModelRenderer({ meshData }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();

        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Convert meshData to BufferGeometry
        const geometry = new THREE.BufferGeometry();

        const vertices = new Float32Array(meshData.vertices.flat());
        const indices = new Uint32Array(meshData.faces.flat());

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        const material = new THREE.MeshStandardMaterial({ color: 0x0077be, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);

        scene.add(mesh);

        // Add lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(10, 10, 10).normalize();
        scene.add(light);

        camera.position.z = 10;

        const animate = () => {
            requestAnimationFrame(animate);
            mesh.rotation.y += 0.01; // Rotate for better visualization
            renderer.render(scene, camera);
        };

        animate();

        // Cleanup
        return () => {
            mountRef.current.removeChild(renderer.domElement);
        };
    }, [meshData]);

    return <div ref={mountRef} />;
}

export default StepModelRenderer;
