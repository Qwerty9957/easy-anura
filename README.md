# v86-Linux

A website that runs a real Linux environment directly in your browser using the [v86](https://github.com/copy/v86) x86 PC emulator powered by WebAssembly.

## Features

- **Real Linux** — Full x86 PC emulated in your browser. Runs a real Linux kernel with a real shell.
- **Built-in Browser** — Use text-based browsers like `links` or `wget` to browse the web from within Linux.
- **No Installation** — Everything runs client-side. No servers, no downloads. Just open the page and boot.

## Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser and click "Boot Linux".

## Build

```bash
npm run build
```

The production build will be in the `dist` directory.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- v86 x86 emulator (WebAssembly)
- Buildroot Linux

## License

See [LICENSE](LICENSE) for details.
