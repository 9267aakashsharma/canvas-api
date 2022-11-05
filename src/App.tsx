import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Image, Layer, Rect, Stage, Text } from "react-konva";
import { useImage } from "react-konva-utils";

import { useCanvasRecorder } from "./hooks";
import canvasBg from "./assets/canvas-background.svg";
import logo from "./assets/logo.png";
import { UserMedia } from "./components";

type StudioState = "ready" | "recording" | "stopped";

const getLocalStream = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  return stream;
};

const screenCapture = async () => {
  let captureStream = null;

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        echoCancellation: true,
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });
  } catch (err) {
    console.error(`Error: ${err}`);
  }
  return captureStream;
};

function App() {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] =
    useState<MediaStream | null>(null);
  const [recordingState, setRecordingState] = useState<StudioState>("ready");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [recordingVideoSrc, setRecordedVideoSrc] = useState("");
  const [canvasSize, setCanvasSize] = useState({
    width: 1920,
    height: 1080,
    scale: 1,
  });

  const [bgImage, bgImageStatus] = useImage(canvasBg, "anonymous", "origin");
  const [logoImage, logoImageStatus] = useImage(logo, "anonymous", "origin");
  const {
    startRecording: startCanvasRecording,
    stopRecording: stopCanvasRecording,
    getBlobs,
  } = useCanvasRecorder();

  const startScreenCapture = async () => {
    const stream = await screenCapture();
    if (stream) {
      setLocalScreenStream(stream);
      setIsScreenSharing(true);
    }
  };

  const stopScreenCapture = () => {
    if (!localScreenStream) return;
    localScreenStream.getTracks().forEach((track) => track.stop());
    setLocalScreenStream(null);
    setIsScreenSharing(false);
  };

  const startRecording = async () => {
    try {
      if (!localStream) return;
      const canvas = document
        .getElementsByClassName("konvajs-content")[0]
        .getElementsByTagName("canvas")[0];
      // addMusic({ volume: 4 });
      if (canvas) {
        startCanvasRecording(canvas, {
          localStream,
        });
        setRecordingState("recording");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const stopRecording = async () => {
    try {
      stopCanvasRecording();
      setRecordingState("stopped");
      stopScreenCapture();
      const blob = await getBlobs();
      console.log("blob", blob);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setRecordedVideoSrc(url);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const localStream = await getLocalStream();
        setLocalStream(localStream);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  useEffect(() => {
    console.log("recordingState", recordingState);
    (async () => {
      try {
        if (recordingState !== "stopped") return;
        const blob = await getBlobs();
        console.log("blob", blob);
        if (blob) {
          const url = URL.createObjectURL(blob);
          setRecordedVideoSrc(url);
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [recordingState]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const container = stageContainerRef.current;
    if (!container || !stage) return;

    const containerWidth = container.offsetWidth;

    const scale = containerWidth / canvasSize.width;
    setCanvasSize({
      ...canvasSize,
      scale,
    });
  }, []);

  if (recordingState === "stopped") {
    return (
      <div className="App">
        <video width={800} src={recordingVideoSrc} controls />
        <br />
        <button onClick={() => setRecordingState("ready")}>Reset</button>
      </div>
    );
  }

  return (
    <div className="App">
      <div ref={stageContainerRef}>
        <Stage
          width={canvasSize.width * canvasSize.scale}
          height={canvasSize.height * canvasSize.scale}
          scale={{
            x: canvasSize.scale,
            y: canvasSize.scale,
          }}
          style={{
            backgroundColor: "#000",
            borderRadius: "10px",
            overflow: "hidden",
          }}
          ref={stageRef}>
          <Layer ref={layerRef}>
            {bgImageStatus === "loaded" && (
              <Image
                width={canvasSize.width}
                height={canvasSize.height}
                image={bgImage}
              />
            )}
            {logoImageStatus === "loaded" && (
              <Image
                width={200}
                height={70}
                image={logoImage}
                x={canvasSize.width - 300}
                y={20}
              />
            )}
            <Rect
              width={700}
              height={70}
              x={20}
              y={12}
              fill="#ffffff99"
              cornerRadius={8}
            />
            <Text
              fill="#434040"
              text="React Bangalore meetup #59"
              fontSize={50}
              x={40}
              y={24}
            />
            <Rect
              width={1300}
              height={900}
              x={20}
              y={120}
              stroke="#ffffff99"
              strokeWidth={2}
              cornerRadius={8}
            />
            {localScreenStream && (
              <UserMedia
                x={20}
                y={120}
                width={1300}
                height={900}
                cornerRadius={8}
                stream={localScreenStream}
              />
            )}
            {localStream && (
              <UserMedia
                x={canvasSize.width - 500}
                y={300}
                width={400}
                height={400}
                cornerRadius={8}
                stream={localStream}
              />
            )}
            <Rect
              width={230}
              height={40}
              x={canvasSize.width - 485}
              y={645}
              fill="#ffffff99"
              cornerRadius={8}
            />
            <Text
              fill="#434040"
              text="Aakash Sharma"
              fontSize={28}
              y={652}
              x={canvasSize.width - 475}
            />
          </Layer>
        </Stage>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "20px",
        }}>
        <button
          onClick={isScreenSharing ? stopScreenCapture : startScreenCapture}>
          {isScreenSharing ? "Stop Sharing" : "Start Screen Sharing"}
        </button>
        <button
          onClick={
            recordingState === "recording" ? stopRecording : startRecording
          }>
          {recordingState === "recording"
            ? "Stop Recording"
            : "Start Recording"}
        </button>
      </div>
    </div>
  );
}

export default App;
