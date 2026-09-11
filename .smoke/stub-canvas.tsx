export function Canvas({ children }: any) {
  return <div data-stub-canvas="1">{children}</div>
}
export function useFrame() {}
export function useThree() {
  return { camera: { position: { set() {} }, lookAt() {}, updateMatrixWorld() {}, rotation: {} } }
}
