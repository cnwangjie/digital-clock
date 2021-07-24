import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import {useRaf} from 'react-use';
import {useState} from 'react'

dayjs.extend(LocalizedFormat)

const Time = () => {
  useRaf(1e11)

  return <span>{ dayjs().format('HH:mm:ss') }</span>
}

const FullscreenBtn = () => {
  const [isFullscreen, setIsFullscreen] = useState(() => {
    return typeof window !== 'undefined' && window.document.fullscreenElement != null
  })

  const toggleFullscreen = async () => {
    if (typeof window === 'undefined') return

    if (isFullscreen) {
      await window.document.exitFullscreen()
    } else {
      await window.document.documentElement.requestFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  return (
    <span onClick={toggleFullscreen}>
      {isFullscreen ? 'Exit fullscreen' : 'Fullscreen' }
    </span>
  )
}

export default function Home() {
  return (
    <div className="select-none absolute inset-0 bg-black text-white flex justify-center items-center">
      <div className="absolute left-8 top-8" style={{ fontSize: 80 }}>
        {dayjs().format('ll ddd')}
      </div>
      <div className="font-mono font-bold" style={{ fontSize: 240 }}>
        <Time />
      </div>
      <div className="absolute right-8 bottom-8">
        <FullscreenBtn />
      </div>
    </div>
  )
}
