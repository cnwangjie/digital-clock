import dayjs from 'dayjs'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import {
  useEvent,
  useInterval,
  useMouse,
  useRaf,
  useToggle,
  useUpdate,
  useBattery,
} from 'react-use'
import { useState, useMemo, useCallback } from 'react'
import useSWR, { mutate } from 'swr'

dayjs.extend(LocalizedFormat)

const Time = () => {
  const update = useUpdate()

  useInterval(update, 1000)

  return <span>{dayjs().format('HH:mm:ss')}</span>
}

const FullscreenBtn = () => {
  const [isFullscreen, setIsFullscreen] = useState(() => {
    return (
      typeof window !== 'undefined' && window.document.fullscreenElement != null
    )
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
      {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
    </span>
  )
}

const Date = () => {
  const update = useUpdate()
  const [show, toggle] = useToggleLocalStorage('show-date', true)

  useInterval(update, 1000)

  return (
    <span
      style={{ opacity: show ? 1 : 0 }}
      onClick={e => {
        e.stopPropagation()
        e.preventDefault()
        toggle()
      }}
    >
      {dayjs().format('ll ddd')}
    </span>
  )
}

const YiYanURL = 'https://v1.hitokoto.cn/'

const YiYan = () => {
  const { data, mutate } = useSWR(YiYanURL, {
    refreshInterval: 60000,
  })

  if (!data) return null

  return (
    <div>
      <div>{data?.hitokoto}</div>{' '}
      <div className="float-right">——{data?.from}</div>
    </div>
  )
}

const fetchText = url =>
  fetch(url).then(res => {
    if (res.status === 200) return res.text()

    return 'weather service is down'
  })

const Weather = () => {
  const { data, mutate } = useSWR('https://wttr.in/?format=3', fetchText, {
    refreshInterval: 3600e3,
  })

  const [show, toggle] = useToggleLocalStorage('show-weather', true)

  return (
    <div
      style={{ opacity: show ? 1 : 0 }}
      onClick={e => {
        e.stopPropagation()
        e.preventDefault()
        toggle()
      }}
    >
      {data}
    </div>
  )
}

const Battery = () => {
  const { fetched, level, charging } = useBattery()

  const [show, toggle] = useToggleLocalStorage('show-battery', true)

  if (!fetched || charging) return null

  return (
    <div
      className="flex justify-end"
      style={{ opacity: show ? 1 : 0 }}
      onClick={e => {
        e.stopPropagation()
        e.preventDefault()
        toggle()
      }}
    >{`Battery: ${(level * 100) << 0}%`}</div>
  )
}

const fetchBlob = url => fetch(url).then(res => res.blob())

const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem(key)
      if (value) {
        try {
          return JSON.parse(value)
        } catch (err) {
          // ignore
        }
      }
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  const set = useCallback(
    setStateAction => {
      setValue(value => {
        const newValue =
          typeof setStateAction === 'function'
            ? setStateAction(value)
            : setStateAction

        localStorage.setItem(key, newValue)
        return newValue
      })
    },
    [setValue]
  )

  return [value, set]
}

const useToggleLocalStorage = (key, initialValue) => {
  const [value, setValue] = useLocalStorage(key, initialValue)
  const toggle = useCallback(() => setValue(v => !v), [])
  return [value, toggle]
}

export default function Home() {
  const {
    data: bg,
    mutate: changeBg,
    isValidating,
  } = useSWR('https://picsum.photos/1080/720', fetchBlob, {
    refreshInterval: 3600e3,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  const [showBg, toggleBg] = useToggleLocalStorage('show-bg', true)
  const [showYiYan, toggleYiYan] = useToggleLocalStorage('show-yi-yan', true)
  const [showPanel, togglePanel] = useToggleLocalStorage('show-panel', true)

  if (typeof window !== 'undefined')
    useEvent('click', e => togglePanel(), window)

  const backgroundImage = useMemo(
    () => bg && `url(${URL.createObjectURL(bg)})`,
    [bg]
  )

  return (
    <div
      style={
        showBg
          ? {
              backgroundImage,
            }
          : undefined
      }
      className="bg-cover bg-center select-none absolute inset-0 bg-black text-white"
    >
      <div
        style={{ backgroundColor: '#000a' }}
        className="absolute inset-0 flex justify-center items-center"
      >
        <div className="absolute left-8 top-8 right-8 flex justify-between 2xl:text-7xl xl:text-6xl md:text-3xl sm:text-xl">
          <Date />
          <div className="flex flex-col gap-4">
            <Weather />
            <Battery />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <div className="h-4"></div>
          <div className="font-mono font-bold 2xl:text-[240px] xl:text-[200px] lg:text-[160px] md:text-[100px] text-[68px]">
            <Time />
          </div>
          <div className="break-words h-4 2xl:text-5xl xl:text-4xl lg:text-3xl">
            {showYiYan && <YiYan />}
          </div>
        </div>
        <div
          className={`absolute bottom-0 w-full p-8 flex justify-end sm:text-base text-sm`}
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          {showPanel && (
            <>
              <span onClick={() => isValidating || changeBg()} className="pr-8">
                Change background
              </span>
              <span onClick={toggleBg} className="pr-8">
                {showBg ? 'Hide' : 'Show'} background
              </span>
              <span onClick={() => mutate(YiYanURL)} className="pr-8">
                Change YiYan
              </span>
              <span onClick={toggleYiYan} className="pr-8">
                {showYiYan ? 'Hide' : 'Show'} YiYan
              </span>
              <FullscreenBtn />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export async function getStaticProps(context) {
  return {
    props: {},
  }
}
