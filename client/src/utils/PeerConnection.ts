import Emitter from './Emmiter';
import MediaDevice from './MediaDevices';
import socket from './socket';

const CONFIG: RTCConfiguration = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] };

type PeerConnectionEventMap = {
  remoteStream: (stream: MediaStream) => void;
  localStream: (stream: MediaStream) => void;
};

class PeerConnection extends Emitter<PeerConnectionEventMap> {
  private remoteId: string;
  private pc: RTCPeerConnection;
  private mediaDevice: MediaDevice;
  private localStream: MediaStream | null = null;

  constructor(remoteId: string) {
    super();
    this.remoteId = remoteId;

    this.pc = new RTCPeerConnection(CONFIG);
    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('call', {
          to: this.remoteId,
          candidate,
        });
      }
    };

    this.pc.ontrack = ({ streams }) => {
      this.emit('remoteStream', streams[0]);
    };

    this.mediaDevice = new MediaDevice();
    this.getDescription = this.getDescription.bind(this);
  }

  start(isCaller: boolean, config?: MediaStreamConstraints): this {
    this.mediaDevice
      .on('stream', (stream: MediaStream) => {
        this.localStream = stream; // Сохраняем локальный поток
        stream.getTracks().forEach((track) => {
          this.pc.addTrack(track, stream);
        });

        this.emit('localStream', stream);

        if (isCaller) {
          socket.emit('request', { to: this.remoteId });
        } else {
          this.createOffer();
        }
      })
      .start(config);

    return this;
  }

  stop(isCaller: boolean): this {
    if (isCaller) {
      socket.emit('end', { to: this.remoteId });
    }
    this.mediaDevice.stop();
    this.pc.restartIce();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    return this;
  }

  createOffer(): this {
    this.pc
      .createOffer()
      .then(this.getDescription)
      .catch(console.error);

    return this;
  }

  createAnswer(): this {
    this.pc
      .createAnswer()
      .then(this.getDescription)
      .catch(console.error);

    return this;
  }

  private getDescription(desc: RTCSessionDescriptionInit): this {
    this.pc.setLocalDescription(desc);
    socket.emit('call', { to: this.remoteId, sdp: desc });

    return this;
  }

  setRemoteDescription(desc: RTCSessionDescriptionInit): this {
    this.pc.setRemoteDescription(new RTCSessionDescription(desc));

    return this;
  }

  addIceCandidate(candidate: RTCIceCandidateInit | null): this {
    if (candidate) {
      this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }

    return this;
  }

  // Новый метод для управления состоянием медиа-устройств
  toggleMediaDevice(deviceType: 'Video' | 'Audio', enabled?: boolean): this {
    if (!this.localStream) return this;

    const trackKind = deviceType.toLowerCase(); // "video" или "audio"
    this.localStream.getTracks().forEach((track) => {
      if (track.kind === trackKind) {
        track.enabled = enabled !== undefined ? enabled : !track.enabled;
      }
    });

    return this;
  }
}

export default PeerConnection;
