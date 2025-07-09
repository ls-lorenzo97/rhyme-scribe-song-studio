import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Edit3, Trash2, Plus, Volume2, Mic, Square } from "lucide-react"

interface SongSection {
  id: string
  name: string
  startTime: string
  duration: number
  isPlaying: boolean
}

export default function Component() {
  const [isRecording, setIsRecording] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration] = useState(183) // 3:03 in seconds
  const [globalPlaying, setGlobalPlaying] = useState(false)
  const [volume, setVolume] = useState([75])

  const [sections, setSections] = useState<SongSection[]>([
    { id: "1", name: "Intro", startTime: "0:00", duration: 10, isPlaying: false },
    { id: "2", name: "Verse 1", startTime: "0:10", duration: 35, isPlaying: false },
    { id: "3", name: "Chorus", startTime: "0:45", duration: 30, isPlaying: false },
    { id: "4", name: "Verse 2", startTime: "1:15", duration: 30, isPlaying: false },
    { id: "5", name: "Chorus", startTime: "1:45", duration: 30, isPlaying: false },
    { id: "6", name: "Bridge", startTime: "2:15", duration: 30, isPlaying: false },
    { id: "7", name: "Outro", startTime: "2:45", duration: 18, isPlaying: false },
  ])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const toggleGlobalPlayback = () => {
    setGlobalPlaying(!globalPlaying)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
  }

  const toggleSectionPlayback = (sectionId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId ? { ...section, isPlaying: !section.isPlaying } : { ...section, isPlaying: false },
      ),
    )
  }

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter((section) => section.id !== sectionId))
  }

  const addSection = () => {
    const newSection: SongSection = {
      id: Date.now().toString(),
      name: "New Section",
      startTime: "3:03",
      duration: 30,
      isPlaying: false,
    }
    setSections([...sections, newSection])
  }

  // Simulate time progression
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (globalPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => (prev + 1) % totalDuration)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [globalPlaying, totalDuration])

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header Controls */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-2 bg-transparent">
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              onClick={toggleGlobalPlayback}
              size="icon"
              className={`h-16 w-16 rounded-full transition-all duration-200 ${
                globalPlaying
                  ? "bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200"
                  : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
              }`}
            >
              {globalPlaying ? <Pause className="h-8 w-8 text-white" /> : <Play className="h-8 w-8 text-white ml-1" />}
            </Button>

            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-2 bg-transparent">
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-slate-600" />
              <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="w-24" />
              <span className="text-sm text-slate-600 w-8">{volume[0]}%</span>
            </div>

            <Button
              onClick={toggleRecording}
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              className={`transition-all duration-200 ${isRecording ? "animate-pulse" : ""}`}
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Record
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-3xl font-mono font-bold text-slate-800">{formatTime(currentTime)}</div>
          <div className="text-lg text-slate-500">/</div>
          <div className="text-lg font-mono text-slate-600">{formatTime(totalDuration)}</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
          />
        </div>
      </div>

      {/* Song Sections */}
      <div className="space-y-4 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Song Structure</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sections.map((section, index) => (
            <Card
              key={section.id}
              className={`p-4 transition-all duration-200 hover:shadow-lg border-2 ${
                section.isPlaying
                  ? "border-orange-400 bg-orange-50 shadow-md"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700">
                  {String(index + 1).padStart(2, "0")}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600">
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSection(section.id)}
                    className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <h3 className="font-semibold text-slate-800 mb-2">{section.name}</h3>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-mono text-slate-600">{section.startTime}</span>
                <span className="text-xs text-slate-500">{section.duration}s</span>
              </div>

              <Button
                onClick={() => toggleSectionPlayback(section.id)}
                size="sm"
                className={`w-full transition-all duration-200 ${
                  section.isPlaying
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {section.isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Playing
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play Section
                  </>
                )}
              </Button>
            </Card>
          ))}

          {/* Add Section Card */}
          <Card className="p-4 border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors duration-200">
            <Button
              onClick={addSection}
              variant="ghost"
              className="w-full h-full min-h-[120px] flex flex-col items-center justify-center gap-2 hover:bg-slate-50"
            >
              <Plus className="h-8 w-8 text-slate-400" />
              <span className="text-slate-600 font-medium">Add Section</span>
            </Button>
          </Card>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-sm text-slate-600 bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <span>Status: {globalPlaying ? "Playing" : "Stopped"}</span>
          {isRecording && (
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Recording
            </div>
          )}
        </div>
        <div>
          {sections.length} sections • {formatTime(totalDuration)} total
        </div>
      </div>
    </div>
  )
}
