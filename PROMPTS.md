# Project Prompts

A chronological record of all user prompts used to build **NextBus SG**.

---

## Prompt 1 — Initial Frontend Application

```text
1. build me a singapore based bus application that tracks real time bus arrivals times and includes search bar to input bus stop code for quick access to arrival data and favorites functionality. 
2. build just the front end for now, i will establish an api connection later.
```

---

## Prompt 2 — LTA DataMall v3 Serverless Integration

```text
1. add a serverless connection that pulls data from LTA's data mall using the following end points:

# Next buses at a stop (v3, the current version; refreshes every 20 seconds):
https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=04121
# To ask about one service only, add &ServiceNo=7

# Every request needs the header:  AccountKey: <LTA_ACCOUNT_KEY>
2. store this in /api at project root level (not the src file) 
3. include a /health.ts and /busarrival.ts within the same subfolder
4. Do not hardcode any key, I will input them manually
```

---

## Prompt 3 — Vercel Deployment Dependency Fix

```text
deployment failed with error, fix this:

10:17:43.305 Running build in Washington, D.C., USA (East) – iad1
10:17:43.306 Build machine configuration: 2 cores, 8 GB
10:17:43.466 Cloning github.com/KeziahVickraman/bus-when (Branch: main, Commit: f7f4f71)
10:17:43.468 Previous build caches not available.
10:17:43.811 Cloning completed: 345.000ms
10:17:45.220 Running "vercel build"
10:17:45.243 Vercel CLI 66.6.0
10:17:46.317 Installing dependencies...
10:17:47.187 npm warn Unknown env config "cache-dir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.
10:18:00.970 npm error code ERESOLVE
10:18:00.972 npm error ERESOLVE could not resolve
10:18:00.973 npm error
10:18:00.973 npm error Found: esbuild@0.25.12
10:18:00.973 npm error node_modules/esbuild
10:18:00.974 npm error   dev esbuild@"^0.25.0" from the root project
10:18:00.974 npm error
10:18:00.974 npm error Could not resolve dependency:
10:18:00.974 npm error peerOptional esbuild@"^0.27.0 || ^0.28.0" from vite@8.4.0
10:18:00.974 npm error node_modules/vite
10:18:00.974 npm error   vite@"^8.3.0" from the root project
10:18:00.975 npm error   peer vite@"^5.2.0 || ^6 || ^7 || ^8" from @tailwindcss/vite@4.3.5
10:18:00.976 npm error   node_modules/@tailwindcss/vite
10:18:00.977 npm error     @tailwindcss/vite@"^4.3.3" from the root project
10:18:00.978 npm error   1 more (@vitejs/plugin-react)
10:18:00.978 npm error
10:18:00.978 npm error Conflicting peer dependency: esbuild@0.28.2
10:18:00.978 npm error node_modules/tsx/node_modules/esbuild
10:18:00.979 npm error   peerOptional esbuild@"^0.27.0 || ^0.28.0" from vite@8.4.0
10:18:00.979 npm error   node_modules/vite
10:18:00.979 npm error     vite@"^8.3.0" from the root project
10:18:00.980 npm error     peer vite@"^5.2.0 || ^6 || ^7 || ^8" from @tailwindcss/vite@4.3.5
10:18:00.981 npm error     node_modules/@tailwindcss/vite
10:18:00.981 npm error       @tailwindcss/vite@"^4.3.3" from the root project
10:18:00.982 npm error     1 more (@vitejs/plugin-react)
10:18:00.982 npm error
10:18:00.983 npm error Fix the upstream dependency conflict, or retry this command with --force or --legacy-peer-deps to accept an incorrect (and potentially broken) dependency resolution.
10:18:00.983 npm error
10:18:00.983 npm error
10:18:00.983 npm error For a full report see:
10:18:00.983 npm error /vercel/.npm/_logs/2026-11-27T02_17_46_594Z-eresolve-report.txt
10:18:00.984 npm error A complete log of this run can be found in: /vercel/.npm/_logs/2026-11-27T02_17_46_594Z-debug-0.log
10:18:01.047 Error: [BUILD_UTILS_SPAWN_1] Command "npm install" exited with 1
```

---

## Prompt 4 — Prompt Collation

```text
collate all prompts and store them in PROMPTS.md
```
