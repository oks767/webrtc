import { useEffect, useState } from 'react';
import { BsCameraVideo, BsPhone } from 'react-icons/bs';
import socket from '../../utils/socket';

import styles from './mainWindow.module.scss'

interface MainWindowProps {
  startCall: (isInitiator: boolean, remoteId: string, config: MediaStreamConstraints) => void;
}

export const MainWindow = ({ startCall }: MainWindowProps) => {
  const [localId, setLocalId] = useState<string>('');
  const [remoteId, setRemoteId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    socket
      .on('init', ({ id }: { id: string }) => {
        setLocalId(id);
      })
      .emit('init');
  }, []);

  const callWithVideo = (video: boolean) => {
    if (!remoteId.trim()) {
      setError('Your friend ID must be specified!');
      return;
    }
    const config: MediaStreamConstraints = { audio: true, video };
    startCall(true, remoteId, config);
  };

  return (
    <div style={styles} className="container main-window">
      <div className="local-id">
        <h2>Your ID is</h2>
        <p>{localId}</p>
      </div>
      <div className="remote-id">
        <label htmlFor="remoteId">Your friend ID</label>
        <p className="error">{error}</p>
        <input
          type="text"
          spellCheck={false}
          placeholder="Enter friend ID"
          onChange={({ target: { value } }) => {
            setError('');
            setRemoteId(value);
          }}
        />
        <div className="control">
          <button onClick={() => callWithVideo(true)}>
            <BsCameraVideo />
          </button>
          <button onClick={() => callWithVideo(false)}>
            <BsPhone />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainWindow;
