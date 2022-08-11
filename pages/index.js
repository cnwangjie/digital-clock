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
  useDebounce,
} from 'react-use'
import { useState, useMemo, useCallback, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { Icon } from '@iconify/react'
import debounce from 'lodash/debounce'

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
    <span onClick={toggleFullscreen} className="flex items-center">
      {isFullscreen ? (
        <Icon fontSize={24} icon="ic:baseline-fullscreen-exit" />
      ) : (
        <Icon fontSize={24} icon="ic:baseline-fullscreen" />
      )}
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
    <div className="text-base md:text-xl lg:text-4xl">
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

const Weather = ({ location = '' }) => {
  const { data, mutate } = useSWR(
    `https://wttr.in/${location}?format=3`,
    fetchText,
    {
      refreshInterval: 3600e3,
    }
  )

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

        localStorage.setItem(key, JSON.stringify(newValue))
        return newValue
      })
    },
    [setValue]
  )

  return [value, set]
}

const useToggleLocalStorage = (key, initialValue) => {
  const [value, setValue] = useLocalStorage(key, initialValue)
  const toggle = useCallback(
    value => setValue(v => (typeof value === 'boolean' ? value : !v)),
    []
  )
  return [value, toggle]
}

export default function Home() {
  const {
    data: bg,
    mutate: changeBg,
    isValidating: bgLoading,
  } = useSWR('https://picsum.photos/1080/720', fetchBlob, {
    refreshInterval: 3600e3,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  const [showBg, toggleBg] = useToggleLocalStorage('show-bg', true)
  const [showYiYan, toggleYiYan] = useToggleLocalStorage('show-yi-yan', true)

  const [showPanel, togglePanel] = useState(false)

  const [weatherLocation, setWeatherLocation] = useLocalStorage(
    'weather-location',
    ''
  )

  const [weatherLocationInputValue, setWeatherLocationInputValue] =
    useState(weatherLocation)

  const changeWeatherLocation = useCallback(
    debounce(setWeatherLocation, 500),
    []
  )

  const [showIcon, setShowIcon] = useState(false)

  const displayIcon = useCallback(() => {
    setShowIcon(true)
  }, [])

  useDebounce(() => setShowIcon(false), 5000, [showIcon])

  if (typeof window !== 'undefined') useEvent('mousemove', displayIcon, window)

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
      onClick={() => {
        togglePanel(false)
        displayIcon()
      }}
    >
      <div style={{ backgroundColor: '#000a' }} className="absolute inset-0">
        <div
          style={{
            opacity: showPanel ? 0.2 : 1,
            filter: showPanel ? 'blur(4px)' : '',
            transition: 'all .5s linear',
          }}
          className="absolute inset-0 flex justify-center items-center"
        >
          <div className="absolute left-8 top-8 right-8 flex justify-between 2xl:text-7xl xl:text-6xl md:text-3xl sm:text-xl">
            <Date />
            <div className="flex flex-col gap-4">
              <Weather location={weatherLocation} />
              <Battery />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="h-4"></div>
            <div className="flex justify-center font-mono font-bold 2xl:text-[240px] xl:text-[200px] lg:text-[160px] md:text-[100px] text-[68px]">
              <Time />
            </div>
            <div className="break-words h-4 2xl:text-5xl xl:text-4xl lg:text-3xl">
              {showYiYan && <YiYan />}
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-0 flex justify-center overflow-y-auto"
        style={{
          opacity: showPanel ? 1 : 0,
          pointerEvents: showPanel ? 'initial' : 'none',
          transition: 'all .5s linear',
        }}
      >
        <div
          className="min-h-screen h-fit py-20 flex flex-col items-center gap-8 text-lg"
          onClick={e => {
            if (showPanel) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
        >
          <span
            onClick={toggleBg}
            className="flex justify-center w-full p-4 ring ring-white rounded-lg active:scale-90 transition"
          >
            background: {showBg ? 'on' : 'off'}
          </span>

          <span
            onClick={() => bgLoading || changeBg()}
            className="flex justify-center w-full p-4 ring ring-white rounded-lg active:scale-90 transition"
          >
            {bgLoading ? 'Loading...' : 'Change background'}
          </span>

          <span
            onClick={toggleYiYan}
            className="flex justify-center w-full p-4 ring ring-white rounded-lg active:scale-90 transition"
          >
            hitokoto: {showYiYan ? 'on' : 'off'}
          </span>

          <span
            onClick={() => mutate(YiYanURL)}
            className="flex justify-center w-full p-4 ring ring-white rounded-lg active:scale-90 transition"
          >
            Change hitokoto
          </span>

          <span className="flex items-center justify-center w-full p-4 ring ring-white rounded-lg">
            Weather:
            <input
              placeholder="auto"
              className="bg-transparent pl-4"
              value={weatherLocationInputValue}
              onChange={e => {
                setWeatherLocationInputValue(e.target.value)
                changeWeatherLocation(e.target.value)
              }}
            />
          </span>
        </div>
      </div>

      <div
        className={`absolute bottom-0 w-full p-8 flex justify-end sm:text-base text-sm`}
        style={{
          opacity: showIcon ? 1 : 0,
          pointerEvents: showIcon ? 'initial' : 'none',
          transition: 'all 1s linear',
        }}
        onClick={e => {
          if (showIcon) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        <span className="flex items-center pr-8" onClick={togglePanel}>
          <Icon fontSize={24} icon="ic:baseline-settings" />
        </span>
        <FullscreenBtn />
      </div>
    </div>
  )
}

export async function getStaticProps(context) {
  return {
    props: {},
  }
}
