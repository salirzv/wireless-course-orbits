import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
// @ts-ignore
import {
	CSS2DRenderer,
	CSS2DObject,
	// @ts-ignore
} from 'three/examples/jsm/renderers/CSS2DRenderer';
import './App.css';
import { GLTF } from 'three/examples/jsm/Addons.js';

export default function OrbitVisualizer() {
	const mountRef = useRef<HTMLDivElement>(null);
	const ER = 6378;
	const ES = 0.009;
	function createSatelliteOrbit({
		parent,
		radius,
		eccentricity = 0,
		inclination = 0,
		color = 0xff0000,
		speed = 0.01,
		showOrbit = true,
		shift = 0,
		text,
		onReady,
	}: {
		parent: THREE.Object3D;
		radius: number;
		eccentricity?: number;
		inclination?: number;
		color?: number;
		speed?: number;
		shift?: number;
		text: string;
		showOrbit?: boolean;
		onReady: (orbitData: {
			satelliteCarrier: THREE.Group;
			a: number;
			b: number;
			shift: number;
			speed: number;
			angle: number;
		}) => void;
	}) {
		const a = radius / ER;
		const b = a * Math.sqrt(1 - eccentricity * eccentricity);
		// const shift = a * eccentricity;

		const orbitGroup = new THREE.Group();
		orbitGroup.rotation.z = THREE.MathUtils.degToRad(inclination);
		parent.add(orbitGroup);

		if (showOrbit) {
			const curve = new THREE.EllipseCurve(
				shift,
				0,
				a,
				b,
				0,
				2 * Math.PI
			);
			const points = curve.getPoints(200);
			const geo = new THREE.BufferGeometry().setFromPoints(
				points.map((p) => new THREE.Vector3(p.x, 0, p.y))
			);
			const line = new THREE.LineLoop(
				geo,
				new THREE.LineBasicMaterial({ color })
			);
			orbitGroup.add(line);
		}

		const loader = new GLTFLoader();
		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath('/draco/');
		loader.setDRACOLoader(dracoLoader);
		loader.load('/Dawn.glb', (gltf: GLTF) => {
			const satellite = gltf.scene;
			satellite.scale.set(0.01, 0.1, 0.1);

			const carrier = new THREE.Group();
			carrier.add(satellite);
			carrier.position.set(a + shift, 0, 0);
			orbitGroup.add(carrier);

			// Create and style label
			const labelDiv = document.createElement('div');
			labelDiv.textContent = text;
			labelDiv.style.padding = '2px 4px';
			labelDiv.style.background = 'rgba(0, 0, 0, 0.6)';
			labelDiv.style.color = '#fff';
			labelDiv.style.fontSize = '12px';
			labelDiv.style.whiteSpace = 'nowrap';
			labelDiv.style.pointerEvents = 'none';

			const labelObj = new CSS2DObject(labelDiv);
			labelObj.position.set(0, 0.2, 0);
			carrier.add(labelObj);

			onReady({
				satelliteCarrier: carrier,
				a,
				b,
				shift,
				speed,
				angle: 0,
			});
		});
	}

	useEffect(() => {
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(
			60,
			window.innerWidth / window.innerHeight,
			0.1,
			2000
		);
		camera.position.z = 5;

		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		});
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(0x000000, 0);

		const labelRenderer = new CSS2DRenderer();
		labelRenderer.setSize(window.innerWidth, window.innerHeight);
		labelRenderer.domElement.style.position = 'absolute';
		labelRenderer.domElement.style.top = '0';
		labelRenderer.domElement.style.pointerEvents = 'none';

		if (mountRef.current) {
			mountRef.current.style.position = 'relative';
			mountRef.current.appendChild(renderer.domElement);
			mountRef.current.appendChild(labelRenderer.domElement);

			// Legend overlay
			const legend = document.createElement('div');
			legend.className = 'legend';
			legend.innerHTML = `
    <div style='color:#e0e068' class='legend-item'>VLEO: Very low Earth orbit, altitude is around 400km, hight fuel consumption, 16 orbits per day </div>
	<div style='color:#FFC300' class='legend-item'>SSO: A Sun-synchronous orbit (SSO), also called a heliosynchronous orbit it is an orbit arranged so that it precesses through one complete revolution each year, so it always maintains the same relationship with the Sun</div>
	<div style='color:#FF5733' class='legend-item'>LEO: A low Earth orbit (LEO) is an orbit around Earth with a period of 128 minutes or less (making at least 11.25 orbits per day) and an eccentricity less than 0.25 </div>
	<div style='color:#C70039' class='legend-item'>MEO: A medium Earth orbit (MEO) is an Earth-centered orbit with an altitude above a low Earth orbit (LEO) and below a high Earth orbit (HEO) – between 2,000 and 35,786 km, about 2 orbits per day</div>
	<div style='color:#900C3F' class='legend-item'>GSO: A geosynchronous orbit (sometimes abbreviated GSO) is an Earth-centered orbit with an orbital period that matches Earth's rotation on its axis, 23 hours, 56 minutes, and 4 seconds (one sidereal day). The synchronization of rotation and orbital period means that, for an observer on Earth's surface, an object in geosynchronous orbit returns to exactly the same position in the sky after a period of one sidereal day.</div>
	<div style='color:#581845' class='legend-item'>GSO: An object in such an orbit has an orbital period equal to Earth's rotational period, one sidereal day, and so to ground observers it appears motionless, in a fixed position in the sky.</div>
	<div style='color:#7a68e0' class='legend-item'>HEO: A highly elliptical orbit (HEO) is an elliptic orbit with high eccentricity. Examples of inclined HEO orbits include Molniya orbits, named after the Molniya Soviet communication satellites which used them, and Tundra orbits.</div>
  `;
			Object.assign(legend.style, {
				position: 'absolute',
				top: '10px',
				left: '10px',
				background: 'rgba(0, 0, 0, 0.6)',
				color: '#fff',
				padding: '20px',
				width: '250px',
				fontSize: '20px',
				borderRadius: '4px',
				pointerEvents: 'none',
			});
			legend.style.pointerEvents = 'auto';
			legend.addEventListener('wheel', (e) => e.stopPropagation());

			mountRef.current.append(legend);
		}

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.minDistance = 2;
		controls.maxDistance = 50;
		controls.enablePan = false;

		const texLoader = new THREE.TextureLoader();
		texLoader.load('/starfield.png', (tex) => {
			tex.minFilter = THREE.LinearFilter;
			tex.magFilter = THREE.LinearFilter;
			tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
			scene.background = tex;
		});

		scene.add(new THREE.AmbientLight(0xffffff, 1));

		const earthGroup = new THREE.Group();
		scene.add(earthGroup);
		texLoader.load('/land_ocean_ice_2048.png', (earthTex) => {
			const earth = new THREE.Mesh(
				new THREE.SphereGeometry(1, 512, 512),
				new THREE.MeshStandardMaterial({ map: earthTex })
			);
			earthGroup.add(earth);

			const np = new THREE.Mesh(
				new THREE.CylinderGeometry(0.01, 0.01, 50),
				new THREE.MeshBasicMaterial({ color: 0xacacac })
			);
			np.position.y = 1;
			earth.add(np);

			const eq = new THREE.EllipseCurve(0, 0, 1, 1, 0, 2 * Math.PI);
			const eqPts = eq.getPoints(200);
			const eqGeo = new THREE.BufferGeometry().setFromPoints(
				eqPts.map((p) => new THREE.Vector3(p.x, 0, p.y))
			);
			earth.add(
				new THREE.LineLoop(
					eqGeo,
					new THREE.LineBasicMaterial({ color: 0xffaa00 })
				)
			);
			earthGroup.rotation.z = THREE.MathUtils.degToRad(-23.44);

			const sats: any[] = [];
			createSatelliteOrbit({
				parent: earthGroup,
				radius: (ER + 1200) * 1.3,
				inclination: 0,
				color: 0xff5733,
				speed: 2.5 * ES,
				showOrbit: true,
				eccentricity: 0.15,
				text: 'LEO',
				onReady: (d) => sats.push(d),
			});
			createSatelliteOrbit({
				parent: earthGroup,
				radius: (ER + 800) * 1.3,
				inclination: -80,
				color: 0xffc300,
				speed: 2.5 * ES,
				showOrbit: true,
				eccentricity: 0,
				text: 'SSO',
				onReady: (d) => sats.push(d),
			});
			createSatelliteOrbit({
				parent: earthGroup,
				radius: (ER + 400) * 1.3,
				inclination: -30,
				color: 0xe0e068,
				speed: 2.5 * ES,
				showOrbit: true,
				eccentricity: 0,
				text: 'VLEO',
				onReady: (d) => sats.push(d),
			});
			createSatelliteOrbit({
				parent: earthGroup,
				radius: (ER + 20000) * 1.1,
				inclination: -56,
				color: 0xc70039,
				speed: 1.3 * ES,
				showOrbit: true,
				eccentricity: 0,
				text: 'MEO',
				onReady: (d) => sats.push(d),
			});
			createSatelliteOrbit({
				parent: earthGroup,
				radius: (ER + 50000) * 0.4,
				inclination: -63,
				color: 0x7a68e0,
				speed: ES,
				showOrbit: true,
				shift: 2,
				eccentricity: 0.8,
				text: 'HEO',
				onReady: (d) => sats.push(d),
			});
			createSatelliteOrbit({
				parent: earthGroup,
				radius: 42164,
				inclination: 0,
				color: 0x581845,
				speed: ES,
				showOrbit: true,
				text: 'GEO',
				onReady: (d) => sats.push(d),
			});
			createSatelliteOrbit({
				parent: earthGroup,
				radius: 42164,
				inclination: -10,
				color: 0x900c3f,
				speed: ES,
				showOrbit: true,
				text: 'GSO',
				onReady: (d) => sats.push(d),
			});

			const animate = () => {
				requestAnimationFrame(animate);
				earth.rotation.y += ES;
				sats.forEach((s) => {
					s.angle -= s.speed;
					const x = s.a * Math.cos(s.angle) + s.shift;
					const z = s.b * Math.sin(s.angle);
					s.satelliteCarrier.position.set(x, 0, z);
				});
				controls.update();
				renderer.render(scene, camera);
				labelRenderer.render(scene, camera);
			};
			animate();
		});

		const onResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
			labelRenderer.setSize(window.innerWidth, window.innerHeight);
		};
		window.addEventListener('resize', onResize);

		return () => {
			window.removeEventListener('resize', onResize);
			if (mountRef.current) {
				mountRef.current.removeChild(renderer.domElement);
				mountRef.current.removeChild(labelRenderer.domElement);
			}
			renderer.dispose();
		};
	}, []);

	return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
}
