import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Monitor, Power, PowerOff, Maximize2, Minimize2, RotateCcw, HardDrive, Cpu, MemoryStick, Loader2 } from 'lucide-react'

declare global {
  interface Window {
    V86: any;
  }
}

function App() {
  const screenContainerRef = useRef<HTMLDivElement>(null)
  const emulatorRef = useRef<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isBooting, setIsBooting] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [statusText, setStatusText] = useState('Ready to boot')

  const loadV86Script = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.V86) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = '/v86/libv86.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load v86'))
      document.head.appendChild(script)
    })
  }

  const startEmulator = async () => {
    if (emulatorRef.current) return
    setIsBooting(true)
    setStatusText('Loading emulator...')

    try {
      await loadV86Script()
      setStatusText('Booting Linux...')

      const emulator = new window.V86({
        wasm_path: '/v86/v86.wasm',
        memory_size: 512 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        screen_container: screenContainerRef.current,
        bios: { url: '/v86/seabios.bin' },
        vga_bios: { url: '/v86/vgabios.bin' },
        cdrom: { url: '/v86/alpine.iso' },
        autostart: true,
        disable_keyboard: false,
        disable_mouse: false,
      })

      emulatorRef.current = emulator

      emulator.add_listener('emulator-ready', () => {
        setIsRunning(true)
        setIsBooting(false)
        setStatusText('Linux is running')
      })

      emulator.add_listener('emulator-stopped', () => {
        setIsRunning(false)
        setIsBooting(false)
        setStatusText('Stopped')
      })
    } catch (err) {
      console.error('Failed to start emulator:', err)
      setIsBooting(false)
      setStatusText('Failed to start emulator')
    }
  }

  const stopEmulator = () => {
    if (emulatorRef.current) {
      emulatorRef.current.stop()
      emulatorRef.current.destroy()
      emulatorRef.current = null
      setIsRunning(false)
      setIsBooting(false)
      setStatusText('Ready to boot')
      if (screenContainerRef.current) {
        const screen = screenContainerRef.current.querySelector('div')
        if (screen) screen.innerHTML = ''
        const canvas = screenContainerRef.current.querySelector('canvas')
        if (canvas) {
          const ctx = canvas.getContext('2d')
          ctx?.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    }
  }

  const restartEmulator = () => {
    if (emulatorRef.current) {
      emulatorRef.current.restart()
      setStatusText('Restarting...')
      setTimeout(() => setStatusText('Linux is running'), 3000)
    }
  }

  const applyFullscreenScale = () => {
    const sc = screenContainerRef.current
    if (!sc) return

    // v86 text mode renders 80 cols × 25 rows at font: 14px monospace, lineHeight: 14px
    // The text div's intrinsic width depends on the monospace font but is ~896px × 350px
    // We hardcode these known dimensions to avoid measurement issues in fullscreen
    const CONTENT_W = 896
    const CONTENT_H = 350

    const vw = window.innerWidth
    const vh = window.innerHeight

    // Check if v86 is in graphics mode (canvas visible)
    const canvas = sc.querySelector('canvas') as HTMLCanvasElement
    let contentW = CONTENT_W
    let contentH = CONTENT_H
    if (canvas && canvas.style.display !== 'none' && canvas.width > 0) {
      contentW = canvas.width
      contentH = canvas.height
    }

    const scale = Math.min(vw / contentW, vh / contentH)
    const scaledW = contentW * scale
    const scaledH = contentH * scale

    // Position and scale the screen_container
    sc.style.cssText = `
      position: absolute;
      width: ${contentW}px;
      height: ${contentH}px;
      overflow: hidden;
      transform-origin: 0 0;
      transform: scale(${scale});
      left: ${(vw - scaledW) / 2}px;
      top: ${(vh - scaledH) / 2}px;
    `
  }

  const resetScreenScale = () => {
    const sc = screenContainerRef.current
    if (!sc) return
    sc.style.cssText = ''
  }

  const toggleFullscreen = () => {
    const container = document.getElementById('fullscreen-target')
    if (!container) return
    if (!document.fullscreenElement) {
      container.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handler = () => {
      if (document.fullscreenElement) {
        setIsFullscreen(true)
        setTimeout(applyFullscreenScale, 50)
      } else {
        setIsFullscreen(false)
        resetScreenScale()
      }
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 p-2 rounded-lg">
            <Monitor className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Linux in the Browser</h1>
            <p className="text-xs text-gray-400">x86 emulator powered by v86</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4 text-xs text-gray-500 mr-4">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> x86</span>
            <span className="flex items-center gap-1"><MemoryStick className="w-3 h-3" /> 512MB</span>
            <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> Alpine Linux (32-bit)</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 shadow-lg shadow-green-500/50' : isBooting ? 'bg-yellow-500 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-xs text-gray-400 ml-1">{statusText}</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div id="emulator-wrapper" className="w-full max-w-4xl bg-gray-900 rounded-xl border border-gray-700 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              {!isRunning && !isBooting ? (
                <button
                  onClick={startEmulator}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-md text-sm font-medium transition-colors"
                >
                  <Power className="w-4 h-4" /> Boot
                </button>
              ) : (
                <>
                  <button
                    onClick={stopEmulator}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-md text-sm font-medium transition-colors"
                  >
                    <PowerOff className="w-4 h-4" /> Stop
                  </button>
                  <button
                    onClick={restartEmulator}
                    disabled={isBooting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" /> Restart
                  </button>
                </>
              )}
            </div>
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </button>
          </div>

          {/* Screen */}
          <div id="fullscreen-target" className="relative bg-black" style={{ minHeight: isFullscreen ? undefined : '400px' }}>
            <div
              ref={screenContainerRef}
              id="screen_container"
              className="w-full"
              style={{ minHeight: isFullscreen ? undefined : '400px' }}
            >
              <div style={{ whiteSpace: 'pre', font: '14px monospace', lineHeight: '14px' }}></div>
              <canvas style={{ display: 'none' }}></canvas>
            </div>

            {/* Overlay when not running */}
            {!isRunning && !isBooting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                <Monitor className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg mb-2">Linux Virtual Machine</p>
                <p className="text-gray-500 text-sm mb-6">Click Boot to start a real Linux environment in your browser</p>
                <button
                  onClick={startEmulator}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-lg font-semibold transition-colors shadow-lg shadow-green-600/30"
                >
                  <Power className="w-5 h-5" /> Boot Linux
                </button>
              </div>
            )}

            {/* Loading overlay */}
            {isBooting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <Loader2 className="w-12 h-12 text-green-400 animate-spin mb-4" />
                <p className="text-green-400 text-lg font-medium">{statusText}</p>
                <p className="text-gray-500 text-sm mt-2">This may take a moment...</p>
              </div>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="w-full max-w-4xl mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-400 mb-1">Real Linux</h3>
            <p className="text-xs text-gray-400">
              A full x86 PC emulated in your browser using WebAssembly. Runs a real Linux kernel with a real shell.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-1">Install Packages</h3>
            <p className="text-xs text-gray-400">
              Alpine uses <code className="text-blue-300">apk</code> — install any package at runtime, like <code className="text-blue-300">apk add links</code> for a text browser.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-purple-400 mb-1">No Installation</h3>
            <p className="text-xs text-gray-400">
              Everything runs client-side. No servers, no downloads. Just open the page and boot.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-gray-800 text-center text-xs text-gray-500">
        Powered by <a href="https://github.com/copy/v86" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">v86</a> — x86 PC emulator running in WebAssembly
      </footer>
    </div>
  )
}

export default App
