import type { FaceLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';

/**
 * Loads MediaPipe's face and body models from this site (public/mediapipe,
 * public/models): no third-party servers, and nothing leaves the browser.
 * Tries the GPU first and falls back to the CPU.
 */
const WASM = '/mediapipe';

let fileset: Promise<unknown> | null = null;
async function vision() {
  const mod = await import('@mediapipe/tasks-vision');
  fileset ??= mod.FilesetResolver.forVisionTasks(WASM);
  return { mod, files: (await fileset) as Awaited<ReturnType<typeof mod.FilesetResolver.forVisionTasks>> };
}

let face: Promise<FaceLandmarker> | null = null;
export function loadFace(): Promise<FaceLandmarker> {
  face ??= (async () => {
    const { mod, files } = await vision();
    const make = (delegate: 'GPU' | 'CPU') =>
      mod.FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    try {
      return await make('GPU');
    } catch {
      return make('CPU');
    }
  })();
  face.catch(() => (face = null));
  return face;
}

let pose: Promise<PoseLandmarker> | null = null;
export function loadPose(): Promise<PoseLandmarker> {
  pose ??= (async () => {
    const { mod, files } = await vision();
    const make = (delegate: 'GPU' | 'CPU') =>
      mod.PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: '/models/pose_landmarker_lite.task', delegate },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
    try {
      return await make('GPU');
    } catch {
      return make('CPU');
    }
  })();
  pose.catch(() => (pose = null));
  return pose;
}

/** Mesh connections for drawing (loaded with the module). */
export async function faceConnections() {
  const { FaceLandmarker } = await import('@mediapipe/tasks-vision');
  return {
    tesselation: FaceLandmarker.FACE_LANDMARKS_TESSELATION,
    contours: [
      ...FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
      ...FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
      ...FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
      ...FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
      ...FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
      ...FaceLandmarker.FACE_LANDMARKS_LIPS,
      ...FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
      ...FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
    ],
  };
}

/** Opens the front (or back) camera. Throws a readable reason on failure. */
export async function openCamera(facing: 'user' | 'environment' = 'user'): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
  } catch (e) {
    const name = (e as DOMException).name;
    throw new Error(name === 'NotAllowedError' ? 'denied' : name === 'NotFoundError' ? 'none' : 'failed');
  }
}

export const cameraErrorText: Record<string, string> = {
  denied: 'Camera access was blocked. Allow the camera for this site in your browser settings, or try with a photo.',
  none: 'No camera was found on this device. You can try with a photo instead.',
  unsupported: 'This browser cannot open the camera here. Try Chrome, Edge or Safari, or use a photo.',
  failed: 'The camera could not start. Close other apps using it and try again, or use a photo.',
};
