import { useState, useEffect, useRef } from 'react';
import { BsCameraVideo, BsPhone } from 'react-icons/bs';
import { FiPhoneOff } from 'react-icons/fi';

import styles from './callWindow.module.scss'

interface CallWindowProps {
  remoteSrc: MediaStream | null; // Поток удаленного видео
  localSrc: MediaStream | null; // Поток локального видео
  config: { video: boolean; audio: boolean }; // Конфигурация медиа
  mediaDevice: {
    toggle: (deviceType: 'Video' | 'Audio', enabled?: boolean) => void; // Управление устройствами
  } | null;
  finishCall: (isEnded: boolean) => void; // Завершение звонка
}

interface Coords {
  x: number;
  y: number;
}

export const CallWindow = ({
  remoteSrc,
  localSrc,
  config,
  mediaDevice,
  finishCall,
}: CallWindowProps) => {
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const localVideoSize = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const [video, setVideo] = useState<boolean>(config.video);
  const [audio, setAudio] = useState<boolean>(config.audio);

  const [dragging, setDragging] = useState<boolean>(false);
  const [coords, setCoords] = useState<Coords>({ x: 350, y: 70 });

  useEffect(() => {
    if (localVideo.current) {
      const { width, height } = localVideo.current.getBoundingClientRect();
      localVideoSize.current = { width, height };
    }
  }, []);

  useEffect(() => {
    if (localVideo.current) {
      if (dragging) {
        localVideo.current.classList.add('dragging');
      } else {
        localVideo.current.classList.remove('dragging');
      }
    }
  }, [dragging]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging) {
        setCoords({
          x: e.clientX - localVideoSize.current.width / 2,
          y: e.clientY - localVideoSize.current.height / 2,
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [dragging]);

  useEffect(() => {
    if (remoteVideo.current && remoteSrc) {
      remoteVideo.current.srcObject = remoteSrc;
    }
    if (localVideo.current && localSrc) {
      localVideo.current.srcObject = localSrc;
    }
  }, [remoteSrc, localSrc]);

  useEffect(() => {
    if (mediaDevice) {
      mediaDevice.toggle('Video', video);
      mediaDevice.toggle('Audio', audio);
    }
  }, [video, audio, mediaDevice]);

  const toggleMediaDevice = (deviceType: 'video' | 'audio') => {
    if (deviceType === 'video') {
      setVideo((prev) => {
        mediaDevice?.toggle('Video', !prev);
        return !prev;
      });
    }
    if (deviceType === 'audio') {
      setAudio((prev) => {
        mediaDevice?.toggle('Audio', !prev);
        return !prev;
      });
    }
  };

  return (
    <div style={styles} className="call-window">
      <div className="inner">
        <div className="video">
          <video className="remote" ref={remoteVideo} autoPlay />
          <video
            className="local"
            ref={localVideo}
            autoPlay
            muted
            onClick={() => setDragging(!dragging)}
            style={{
              top: `${coords.y}px`,
              left: `${coords.x}px`,
              position: 'absolute',
            }}
          />
        </div>
        <div className="control">
          <button
            className={video ? '' : 'reject'}
            onClick={() => toggleMediaDevice('video')}
          >
            <BsCameraVideo />
          </button>
          <button
            className={audio ? '' : 'reject'}
            onClick={() => toggleMediaDevice('audio')}
          >
            <BsPhone />
          </button>
          <button className="reject" onClick={() => finishCall(true)}>
            <FiPhoneOff />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallWindow;
