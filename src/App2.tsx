import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Image, Layer, Stage, Text } from "react-konva";
import { useImage } from "react-konva-utils";

import { useCanvasRecorder } from "./hooks";
import canvasBg from "./assets/canvas-background.svg";
import { UserMedia } from "./components";

type StudioState = "ready" | "recording" | "stopped";

const getLocalStream = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  return stream;
};

function App() {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [recordingState, setRecordingState] = useState<StudioState>("ready");
  const [recordingVideoSrc, setRecordedVideoSrc] = useState("");
  const [canvasSize, setCanvasSize] = useState({
    width: 1920,
    height: 1080,
    scale: 1,
  });

  const [image, status] = useImage(canvasBg, "anonymous", "origin");
  const {
    superBlob,
    startRecording: startCanvasRecording,
    stopRecording: stopCanvasRecording,
    getBlobs,
  } = useCanvasRecorder();

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
    if (!superBlob) return;
    const url = URL.createObjectURL(superBlob);
    setRecordedVideoSrc(url);
  }, [superBlob]);

  // useEffect(() => {
  //   console.log("recordingState", recordingState);
  //   (async () => {
  //     try {
  //       if (recordingState !== "stopped") return;
  //       const blob = await getBlobs();
  //       console.log("blob", blob);
  //       if (blob) {
  //         const url = URL.createObjectURL(blob);
  //         setRecordedVideoSrc(url);
  //       }
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   })();
  // }, [recordingState]);

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
          ref={stageRef}
        >
          <Layer ref={layerRef}>
            {status === "loaded" && (
              <Image
                width={canvasSize.width}
                height={canvasSize.height}
                image={image}
              />
            )}
            <Text fill="#fff" text="Hi there this is my canvas" />
            {localStream && (
              <UserMedia
                x={canvasSize.width - 100}
                y={canvasSize.height - 300}
                width={200}
                height={200}
                stream={localStream}
              />
            )}
          </Layer>
        </Stage>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        <button
          onClick={
            recordingState === "recording" ? stopRecording : startRecording
          }
        >
          {recordingState === "recording"
            ? "Stop Recording"
            : "Start Recording"}
        </button>
      </div>
    </div>
  );
}

export default App;
