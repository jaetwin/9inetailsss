import React, { useRef, Suspense, useState, useEffect, useMemo } from 'react';
import { useGLTF, Center, useScroll, Sparkles, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GlowShaderMaterial = {
  uniforms: {
    color1: { value: new THREE.Color("#ffeedd") },
    color2: { value: new THREE.Color("#000000") },
    radius: { value: 0.5 },
    // Reduced from 1.0 to 0.45 to stop blinding washout
    intensity: { value: 0.45 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float radius;
    uniform float intensity;
    varying vec2 vUv;
    void main() {
      // Distance from center of plane
      float dist = distance(vUv, vec2(0.5));
      // Smooth radial falloff
      float alpha = smoothstep(radius, 0.0, dist);
      // Mix colors
      vec3 finalColor = mix(color2, color1, alpha);
      gl_FragColor = vec4(finalColor, alpha * intensity);
    }
  `
};

function SafeModel({ url, position, rotation, scale, isLeftAngel, isRightAngel, isCenter }: any) {
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(url, { method: 'HEAD' })
      .then(res => {
        if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
          setExists(true);
        } else {
          setExists(false);
        }
      })
      .catch(() => setExists(false));
  }, [url]);

  if (exists === null || exists === false) return null;

  return (
    <Suspense fallback={null}>
      <Model 
        url={url} 
        position={position} 
        rotation={rotation} 
        scale={scale} 
        isLeftAngel={isLeftAngel} 
        isRightAngel={isRightAngel} 
        isCenter={isCenter} 
      />
    </Suspense>
  );
}

function Model({ url, position, rotation, scale, isLeftAngel, isRightAngel, isCenter }: any) {
  const { scene } = useGLTF(url) as any;
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // r is between 0 and 1, representing normalized scroll scroll progression
    const r = scroll.offset; 

    if (isLeftAngel) {
      groupRef.current.rotation.y = rotation[1] + (r * Math.PI / 8);
      groupRef.current.position.z = position[2] + (r * 6.0);
      groupRef.current.position.x = THREE.MathUtils.lerp(position[0], -6.0, r);
      // Move down on Y axis as we scroll down to prevent head cutoff
      groupRef.current.position.y = position[1] - (r * 3.5); 
    }
    /* Angel 2 (Right) - Absolute Position Logic */
    /* The glb origins are not perfectly mirrored, so we use absolute positioning */
    if (isRightAngel) {
      groupRef.current.rotation.y = rotation[1] - (r * Math.PI / 8);
      // Keep her strictly locked to her designated X/Y/Z coordinates to prevent gliding/crashing
      groupRef.current.position.x = position[0];
      groupRef.current.position.z = position[2];
      groupRef.current.position.y = position[1]; 
    }

    if (isCenter) {
      // Smoothed out floating animation for crucifix
      const floatVal = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
      groupRef.current.position.y = position[1] + floatVal;
      groupRef.current.position.z = position[2] + (r * 3.0); 
      groupRef.current.rotation.y = rotation[1] + (r * Math.PI * 0.05);
    }
  });

  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          // Disable shadows for performance since these are high poly
          child.castShadow = false;
          child.receiveShadow = false;
          if (child.material) {
            child.material.roughness = 0.5;
            child.material.metalness = 0.6;
            child.material.envMapIntensity = 0.8; // Reduced to prevent blow-out and lag
          }
        }
      });
    }
  }, [scene]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={scene.clone()} />
    </group>
  );
}

// Cinematic fade-in overlay
function FadeInOverlay() {
  const overlayRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (overlayRef.current) {
      const material = overlayRef.current.material as THREE.MeshBasicMaterial;
      if (material.opacity > 0) {
        // Smoothly reduce opacity to 0 over ~2 seconds
        material.opacity = Math.max(0, material.opacity - delta * 0.5);
      }
    }
  });

  return (
    <Billboard position={[0, 0, 10]}> {/* Placed very close to camera */}
      <mesh ref={overlayRef}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#060606" transparent={true} opacity={1} depthWrite={false} depthTest={false} />
      </mesh>
    </Billboard>
  );
}

export default function Scene3D() {
  const sceneGroup = useRef<THREE.Group>(null);

  return (
    <group ref={sceneGroup}>
      {/* Dynamic atmospheric dust/ash floating around the scene */}
      <Sparkles count={500} scale={25} size={2.5} speed={0.5} opacity={0.6} color="#ffeebb" position={[0, -2, -6]} />
      
      {/* 
        CRITICAL FIX: The <Center> tag automatically calculates bounding boxes for all child objects
        and shifts the entire group forward/backward to align it perfectly.
        When the massive 45x45 Billboard (the custom GLSL glow) was placed at Z=-15 inside <Center>,
        the bounding box became so deep that <Center> violently shoved the models directly into the camera lens.
        Now, <Center> ONLY wraps the physical 3D statues, guaranteeing perfect, stable framing regardless of background glow.
      */}
      <Center position={[0, -1, 0]}>
        {/* Jesus Cross: Center foreground focal point */}
        <SafeModel 
          url="/3D Models/Jesus.glb" 
          position={[0, -3.5, -3]} 
          rotation={[0, 0, 0]} 
          scale={3.8} 
          isCenter={true}
        />
        
        {/* Angel 1 (Left) - Lowered Y to -2.8 to keep head fully visible at all scroll depths */}
        <SafeModel 
          url="/3D Models/Angel1.glb" 
          position={[-7.5, -2.8, -12]} 
          rotation={[0, Math.PI / 6, 0]} 
          scale={2.2} 
          isLeftAngel={true}
        />
        
        {/* Angel 2 (Right) - Safely anchored to coordinate X:11, exactly between the cross and screen edge */}
        <SafeModel 
          url="/3D Models/Angel2.glb" 
          position={[11, -2, -1]} 
          rotation={[0, -Math.PI / 6, 0]} 
          scale={3.2} 
          isRightAngel={true}
        />
      </Center>

      {/*
        True Volumetric 3D Glow Orb using Custom GLSL Shader.
        Moved OUTSIDE the Center block so it doesn't break framing zoom.
        Z=-15 safely places it far behind all models.
      */}
      <Billboard position={[0, 1.0, -18.0]}>
        <mesh>
          <planeGeometry args={[45, 45]} />
          <shaderMaterial
            vertexShader={GlowShaderMaterial.vertexShader}
            fragmentShader={GlowShaderMaterial.fragmentShader}
            uniforms={GlowShaderMaterial.uniforms}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>
      
      {/* Smooth cinematic black fade over camera on mount */}
      <FadeInOverlay />
      
      {/* Primary central warm illumination cast onto the 3D models - significantly reduced from 1800 to 900 */}
      <pointLight position={[0, -2.5, -1.0]} intensity={900} color="#ffeedd" distance={70} decay={2.0} />
      
      {/* Soft front-lighting to ensure stone details are legible without blowing out background */}
      <pointLight position={[0, 0.0, 5.0]} intensity={300} color="#ffffff" distance={30} decay={2.0} />
      
      {/* Soft ambient fill */}
      <ambientLight intensity={0.4} color="#ffffff" />
    </group>
  );
}

useGLTF.preload('/3D Models/Jesus.glb');
useGLTF.preload('/3D Models/Angel1.glb');
useGLTF.preload('/3D Models/Angel2.glb');
