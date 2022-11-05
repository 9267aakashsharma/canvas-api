/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, useState } from "react";
import { saveAs } from "file-saver";
import { extension } from "mime-types";
import pointsMusic from "../assets/bubblePopMusic.mp3";
import { getSeekableWebM } from "../utils/helpers";

const types = [
  // "video/x-matroska;codecs=avc1",
  // "video/webm;codecs=h264",
  "video/webm",
  // "video/webm,codecs=vp9",
  // "video/vp8",
  "video/webm;codecs=vp8",
  // "video/webm;codecs=daala",
  // "video/mpeg",
];

type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<
  infer ElementType
>
  ? ElementType
  : never;

interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: number): MediaStream;
}

export type AudioType = "transition" | "shorts" | "points";
export type MusicAction = "start" | "stop" | "modifyVolume";

const useCanvasRecorder = (
  videoBitsPerSecond: number | undefined = 12000000
) => {
  const recordedBlobs = useRef<Blob[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [superBlob, setSuperBlob] = useState<Blob | null>(null);

  const [type, setType] = useState<ElementType<typeof types>>();

  const handleDataAvailable = (event: BlobEvent): any => {
    console.log("handleDataAvailable", event);
    if (event.data && event.data.size > 0) {
      recordedBlobs.current.push(event.data);
    }
  };

  const ctx = useRef<AudioContext | null>(null);
  const dest = useRef<MediaStreamAudioDestinationNode | null>(null);

  /**
   * Starts recording...
   */
  const startRecording = (
    canvas: HTMLCanvasElement,
    { localStream }: { localStream: MediaStream }
  ) => {
    if (!canvas) return;

    const stream = (canvas as CanvasElement).captureStream(60);

    if (!stream) {
      throw Error("No stream found");
    }

    const type = types.find((type) => MediaRecorder.isTypeSupported(type));
    if (!type) {
      throw Error("No supported type found for MediaRecorder");
    }

    setType(type);

    try {
      ctx.current = new AudioContext({});

      ctx.current?.createMediaStreamSource(localStream);

      const tracks = localStream.getTracks();
      const audioStream = ctx.current?.createMediaStreamSource(
        new MediaStream(tracks)
      );

      dest.current = ctx.current.createMediaStreamDestination();
      audioStream.connect(dest.current);

      ctx.current.createMediaStreamSource(localStream).connect(dest.current);

      const mediaRecorder = new MediaRecorder(
        new MediaStream([
          ...stream.getTracks(),
          ...dest.current.stream.getTracks(),
        ]),
        {
          videoBitsPerSecond,
          mimeType: type,
        }
      );

      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.onstop = handleMediaRecorderStop;
      mediaRecorder.start(1000); // collect 100ms of data blobs

      setMediaRecorder(mediaRecorder);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMediaRecorderStop = () => {
    const superblob = new Blob([...recordedBlobs.current], { type });
    setSuperBlob(superblob);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
  };

  const download = async (fileName?: string) => {
    const blob = await getBlobs();
    if (!blob) return;

    // eslint-disable-next-line no-param-reassign
    fileName = fileName || `${"recording."}${extension(type as string)}`;
    saveAs(blob, fileName);
    console.log("Successfully saved file!");
  };

  const getBlobs = async () => {
    try {
      console.log("Getting blobs...", recordedBlobs.current);
      const superblob = new Blob([...recordedBlobs.current], { type });
      // const arrayBuffer = await superblob.arrayBuffer();
      // console.log("Got arrayBuffer", arrayBuffer);
      // if (arrayBuffer) return getSeekableWebM(arrayBuffer);
      return superblob;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  };

  const reset = () => {
    recordedBlobs.current = [];
    setMediaRecorder(null);
  };

  return {
    superBlob,
    startRecording,
    stopRecording,
    download,
    getBlobs,
    reset,
  };
};

export default useCanvasRecorder;
