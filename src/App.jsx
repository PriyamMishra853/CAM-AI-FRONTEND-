import { lazy, Suspense } from 'react'
import { MotionConfig } from 'framer-motion'
import { SystemDataProvider } from './hooks/useSystemData'
import { StageProvider } from './components/ui/primitives'
import ViewfinderHUD from './components/ViewfinderHUD'
import CustomCursor from './components/CustomCursor'
import Hero from './components/Hero'
import CameraLens from './components/CameraLens'
import RTSPStream from './components/RTSPStream'
import Server01 from './components/Server01'
import DatabaseMemory from './components/DatabaseMemory'
import Server02 from './components/Server02'
import AICompute from './components/AICompute'
import SecureLink from './components/SecureLink'

// Heavier, further-down sections load after first paint.
const DGXA100 = lazy(() => import('./components/DGXA100'))
const AttendanceResult = lazy(() => import('./components/AttendanceResult'))
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const Architecture = lazy(() => import('./components/Architecture'))

/** Holds the stage's place (and anchor id) while its chunk loads. */
const Placeholder = ({ id, h }) => <section id={id} style={{ minHeight: h }} aria-busy="true" />

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SystemDataProvider>
        <StageProvider>
          <a
            href="#camera"
            className="sr-only z-[200] bg-signal px-4 py-2 text-void focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
          >
            Skip to the story
          </a>
          <CustomCursor />
          <ViewfinderHUD />
          <main>
            <Hero />
            <CameraLens />
            <RTSPStream />
            <Server01 />
            <DatabaseMemory />
            <Server02 />
            <AICompute />
            <SecureLink />
            <Suspense fallback={<Placeholder id="dgx" h="260vh" />}>
              <DGXA100 />
            </Suspense>
            <Suspense fallback={<Placeholder id="result" h="300vh" />}>
              <AttendanceResult />
            </Suspense>
            <Suspense fallback={<Placeholder id="dashboard" h="120vh" />}>
              <AdminDashboard />
            </Suspense>
            <Suspense fallback={<Placeholder id="architecture" h="150vh" />}>
              <Architecture />
            </Suspense>
          </main>
        </StageProvider>
      </SystemDataProvider>
    </MotionConfig>
  )
}
