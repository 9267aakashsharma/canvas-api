/* eslint-disable consistent-return */
import Konva from "konva";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import RoundedImage from "./RoundedImage";

const UserMedia = ({
  x,
  y,
  width,
  height,
  stream,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  cornerRadius: number;
  stream: MediaStream | null;
}) => {
  const imageRef = useRef<Konva.Image | null>(null);

  const videoElement = React.useMemo(() => {
    if (!stream) return;
    const element = document.createElement("video");
    element.srcObject = stream;
    element.muted = true;

    return element;
  }, [stream]);

  useLayoutEffect(() => {
    if (!videoElement || !imageRef.current) return;
    videoElement.play();

    const layer = imageRef.current.getLayer();

    const anim = new Konva.Animation(() => {}, layer);
    anim.start();

    return () => {
      anim.stop();
    };
  }, [videoElement, imageRef.current]);

  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.srcObject = stream;
  }, [ref.current]);

  if (!videoElement || !stream) return null;

  return (
    <RoundedImage
      ref={imageRef}
      image={videoElement}
      width={width}
      height={height}
      cornerRadius={10}
      x={x}
      y={y}
    />
  );
};

export default UserMedia;
