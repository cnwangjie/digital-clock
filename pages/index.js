import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import {useEvent, useInterval, useMouse, useRaf, useUpdate} from 'react-use';
import {useState} from 'react'
import useSWR from 'swr';

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

const Header = () => {
  const update = useUpdate()

  useInterval(update, 1000)

  return <span>
    {dayjs().format('ll ddd')}
  </span>
}

const YiYan = () => {
  const { data, mutate } = useSWR('https://v1.hitokoto.cn/', {
    refreshInterval: 60000,
  })

  if (typeof window !== 'undefined') useEvent('click', () => mutate(), window)

  if (!data) return null

  return <div>
    <div>{data?.hitokoto}</div> <div className="float-right">——{data?.from}</div>
  </div>
}

const fetchText = url => fetch(url).then(res => res.text())

const Weather = () => {
  const { data, mutate } = useSWR('https://wttr.in/?format=3', fetchText, {
    refreshInterval: 3600e3,
  })

  return <div>
    {data}
  </div>
}

export default function Home() {
  return (
    <div className="select-none absolute inset-0 bg-black text-white flex justify-center items-center">
      <div className="absolute left-8 top-8 right-8 flex justify-between" style={{ fontSize: 80 }}>
        <Header />
        <Weather />
      </div>
      <div className="font-mono font-bold" style={{ fontSize: 240 }}>
        <Time />
        <div className="break-words h-4" style={{ bottom: '25%', fontSize: 36, width: 1200 }}>
          <YiYan />
        </div>
      </div>
      <div className="absolute right-8 bottom-8">
        <FullscreenBtn />
      </div>
    </div>
  )
}
