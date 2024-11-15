import { BsCameraVideo, BsPhone } from 'react-icons/bs'
import { FiPhoneOff } from 'react-icons/fi'

interface CallModalProps {
    callFrom: string; // ID звонящего
    startCall: (isGroup: boolean, peerId: string, config: MediaStreamConstraints) => void; // Метод для начала звонка
    rejectCall: () => void; // Метод для отклонения звонка
  }

// функция принимает `id` звонящего и методы для принятия звонка и его отклонения
export const CallModal = ({ callFrom, startCall, rejectCall}: CallModalProps ): JSX.Element => {
 // звонок может приниматься с видео и без
    const acceptWithVideo = (video: boolean) => {
    const config = { audio: true, video }
    // инициализация `PeerConnection`
    startCall(false, callFrom, config)
   }
   return (
    <div className='call-modal'>
      <div className='inner'>
        <p>{`${callFrom} is calling`}</p>
        <div className='control'>
          {/* принимаем звонок с видео */}
          <button onClick={() => acceptWithVideo(true)}>
            <BsCameraVideo />
          </button>
          {/* принимаем звонок без видео */}
          <button onClick={() => acceptWithVideo(false)}>
            <BsPhone />
          </button>
          {/* отклоняем звонок */}
          <button onClick={rejectCall} className='reject'>
            <FiPhoneOff />
          </button>
        </div>
      </div>
    </div>
   )

}

export default CallModal;