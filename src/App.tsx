import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Konva from "konva";
import { Image, Layer, Stage, Text } from "react-konva";
import { useImage } from "react-konva-utils";

import canvasBg from "./assets/canvas-background.svg";

function App() {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder>(null);
  const blobs = useRef<Blob[]>([]);

  const [canvasSize, setCanvasSize] = useState({
    width: 1920,
    height: 1080,
    scale: 1,
  });

  const [image, status] = useImage(canvasBg, "anonymous", "origin");

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

  const startRecording = async () => {
    const canvas = document
      .getElementsByClassName("konvajs-content")[0]
      .getElementsByTagName("canvas")[0];

    const stream = canvas.captureStream(30);

    console.log("tracks", stream.getTracks());

    const recorder = new MediaRecorder(
      new MediaStream([...stream.getTracks()]),
      {
        videoBitsPerSecond: 2500000,
        mimeType: "video/webm",
      }
    );

    console.log("recorder", recorder);

    recorder.ondataavailable = function (e) {
      console.log("data available");
      console.log(e.data);
      console.log(e.data.size);
      if (e.data && e.data.size > 0) blobs.current.push(e.data);
    };

    recorder.start(200);

    setTimeout(() => {
      recorder.stop();
      const blob = new Blob(blobs.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      console.log(url);
      const a = document.createElement("a");
      a.href = url;
      a.download = "test.webm";
      a.click();
      document.body.removeChild(a);
    }, 3000);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    const blob = new Blob(blobs.current, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    console.log(url);
  };

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
        <button onClick={startRecording}>start</button>
        <button onClick={stopRecording}>stop</button>
      </div>
    </div>
  );
}

export default App;
