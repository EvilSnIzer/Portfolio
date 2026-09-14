import { EffectComposer, Bloom } from '@react-three/postprocessing'

/**
 * One pass, mipmap-blurred: this is the entire post-processing budget for the
 * site. Stacking a second (or third) pass is how a 60fps scroll experience turns
 * into 40fps on a laptop with a shared GPU, so there is no DOF, no chromatic
 * aberration and no SMAA — the film grain (DOM overlay) does the "not plastic"
 * work for free.
 */
export default function EffectsBloom() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.62}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.34}
        mipmapBlur
        radius={0.72}
      />
    </EffectComposer>
  )
}
