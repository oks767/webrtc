

import { useState, useEffect } from 'react';
import { BsPhoneVibrate } from 'react-icons/bs';

import PeerConnection from './utils/PeerConnection';
import socket from './utils/socket';

import { MainWindow } from './components/main-window/MainWindow';
import CallModal from './components/call-modal/callModal';
import { CallWindow } from './components/call-window/callWindow';

interface MediaDevice {
  toggle: (deviceType: 'Video' | 'Audio', enabled?: boolean) => void;
}

interface Config {
  video: boolean;
  audio: boolean;
}

export default function App() {
  const [callFrom, setCallFrom] = useState<string>('');
  const [calling, setCalling] = useState<boolean>(false);

  const [showModal, setShowModal] = useState<boolean>(false);

  const [localSrc, setLocalSrc] = useState<MediaStream | null>(null);
  const [remoteSrc, setRemoteSrc] = useState<MediaStream | null>(null);

  const [pc, setPc] = useState<PeerConnection | null>(null);
  const [config, setConfig] = useState<Config | null>(null);

  const [mediaDevice, setMediaDevice] = useState<MediaDevice | null>(null);

  useEffect(() => {
    socket.on('request', ({ from }: { from: string }) => {
      setCallFrom(from);
      setShowModal(true);
    });
  }, []);

  useEffect(() => {
    if (!pc) return;

    socket
      .on('call', (data: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) => {
        if (data.sdp) {
          pc.setRemoteDescription(data.sdp);

          if (data.sdp.type === 'offer') {
            pc.createAnswer();
          }
        } else if (data.candidate) {
          pc.addIceCandidate(data.candidate);
        }
      })
      .on('end', () => finishCall(false));

    setMediaDevice({
      toggle: (deviceType: 'Video' | 'Audio', enabled?: boolean) => {
        pc.toggleMediaDevice(deviceType, enabled);
      },
    });
  }, [pc]);

  const startCall = (isCaller: boolean, remoteId: string, config: MediaStreamConstraints) => {
    // Преобразуем MediaStreamConstraints в строгий объект { video: boolean; audio: boolean }
    const normalizedConfig = {
      video: typeof config.video === 'boolean' ? config.video : false,
      audio: typeof config.audio === 'boolean' ? config.audio : false,
    };
  
    setShowModal(false);
    setCalling(true);
  
    setConfig(normalizedConfig); // Устанавливаем config в ожидаемом формате
  
    const _pc = new PeerConnection(remoteId)
      .on('localStream', (stream: MediaStream) => {
        setLocalSrc(stream);
      })
      .on('remoteStream', (stream: MediaStream) => {
        setRemoteSrc(stream);
        setCalling(false);
      })
      .start(isCaller, config); // Передаем исходный MediaStreamConstraints в WebRTC
  
    setPc(_pc);
  };
  
  

  const rejectCall = () => {
    socket.emit('end', { to: callFrom });

    setShowModal(false);
  };

  const finishCall = (isCaller: boolean) => {
    pc?.stop(isCaller);

    setPc(null);
    setConfig(null);
    setMediaDevice(null);

    setCalling(false);
    setShowModal(false);

    setLocalSrc(null);
    setRemoteSrc(null);
  };

  return (
    <div className="app">
      <h1>React WebRTC</h1>
      <MainWindow startCall={startCall} />
      {calling && (
        <div className="calling">
          <button disabled>
            <BsPhoneVibrate />
          </button>
        </div>
      )}
      {showModal && (
        <CallModal callFrom={callFrom} startCall={startCall} rejectCall={rejectCall} />
      )}
      {remoteSrc && (
        <CallWindow
          localSrc={localSrc}
          remoteSrc={remoteSrc}
          config={config!} // Используем `config!` так как оно гарантированно установлено при наличии `remoteSrc`
          mediaDevice={mediaDevice}
          finishCall={finishCall}
        />
      )}
    </div>
  );
}
