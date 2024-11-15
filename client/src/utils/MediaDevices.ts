import Emitter from './Emmiter';

type MediaStreamEventMap = {
  stream: (stream: MediaStream) => void;
};

class MediaDevice extends Emitter<MediaStreamEventMap> {
  private stream?: MediaStream;

  start(config?: MediaStreamConstraints): this {
    navigator.mediaDevices
      .getUserMedia(config || { audio: true, video: true })
      .then((stream: MediaStream) => {
        this.stream = stream;
        this.emit('stream', stream);
      })
      .catch(console.error);

    return this;
  }

  toggle(type: 'Audio' | 'Video', on?: boolean): this {
    if (this.stream) {
      const tracks = this.stream[`get${type}Tracks`]();
      tracks.forEach((track) => {
        track.enabled = on !== undefined ? on : !track.enabled;
      });
    }

    return this;
  }

  stop(): this {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    this.off(); // Clears all event listeners

    return this;
  }
}

export default MediaDevice;
