"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  Edit3,
  Trash2,
  MoreHorizontal,
  GripVertical,
  FileText,
  PlusCircle,
  X,
} from "lucide-react"

interface LyricSentence {
  id: string
  text: string
  startTime?: number
  endTime?: number
}

interface SongSection {
  id: string
  name: string
  startTime: number
  endTime: number
  isActive: boolean
  color: string
  lyrics: LyricSentence[]
}

const sectionColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-red-500",
]

export default function Component() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(240) // 4:00 in seconds
  const [draggedSection, setDraggedSection] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [editingSection, setEditingSection] = useState<SongSection | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)
  const [selectedSectionForLyrics, setSelectedSectionForLyrics] = useState<string | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [lyricsPreviewMode, setLyricsPreviewMode] = useState(false)

  const [sections, setSections] = useState<SongSection[]>([
    {
      id: "1",
      name: "Intro",
      startTime: 0,
      endTime: 15,
      isActive: true,
      color: "bg-blue-500",
      lyrics: [],
    },
    {
      id: "2",
      name: "Verse 1",
      startTime: 15,
      endTime: 45,
      isActive: false,
      color: "bg-green-500",
      lyrics: [
        { id: "l1", text: "Walking down this empty street tonight" },
        { id: "l2", text: "Stars are shining oh so bright" },
        { id: "l3", text: "Thinking about the words you said" },
        { id: "l4", text: "Running circles in my head" },
      ],
    },
    {
      id: "3",
      name: "Pre-Chorus",
      startTime: 45,
      endTime: 60,
      isActive: false,
      color: "bg-purple-500",
      lyrics: [
        { id: "l5", text: "And I know, and I know" },
        { id: "l6", text: "This feeling's got to go" },
      ],
    },
    {
      id: "4",
      name: "Chorus",
      startTime: 60,
      endTime: 90,
      isActive: false,
      color: "bg-orange-500",
      lyrics: [
        { id: "l7", text: "We're dancing in the moonlight" },
        { id: "l8", text: "Everything's gonna be alright" },
        { id: "l9", text: "Hold me close, don't let me go" },
        { id: "l10", text: "This is all I need to know" },
      ],
    },
    {
      id: "5",
      name: "Verse 2",
      startTime: 90,
      endTime: 120,
      isActive: false,
      color: "bg-green-500",
      lyrics: [],
    },
    {
      id: "6",
      name: "Pre-Chorus",
      startTime: 120,
      endTime: 135,
      isActive: false,
      color: "bg-purple-500",
      lyrics: [],
    },
    {
      id: "7",
      name: "Chorus",
      startTime: 135,
      endTime: 165,
      isActive: false,
      color: "bg-orange-500",
      lyrics: [],
    },
    {
      id: "8",
      name: "Bridge",
      startTime: 165,
      endTime: 195,
      isActive: false,
      color: "bg-pink-500",
      lyrics: [],
    },
    {
      id: "9",
      name: "Final Chorus",
      startTime: 195,
      endTime: 225,
      isActive: false,
      color: "bg-orange-500",
      lyrics: [],
    },
    {
      id: "10",
      name: "Outro",
      startTime: 225,
      endTime: 240,
      isActive: false,
      color: "bg-indigo-500",
      lyrics: [],
    },
  ])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const jumpToSection = (startTime: number, sectionId: string) => {
    setCurrentTime(startTime)
    setSections(sections.map((s) => ({ ...s, isActive: s.id === sectionId })))
  }

  const deleteSection = (sectionId: string) => {
    const newSections = sections.filter((s) => s.id !== sectionId)
    let currentTime = 0
    const updatedSections = newSections.map((section) => {
      const duration = section.endTime - section.startTime
      const updatedSection = {
        ...section,
        startTime: currentTime,
        endTime: currentTime + duration,
      }
      currentTime += duration
      return updatedSection
    })
    setSections(updatedSections)
    setTotalDuration(currentTime)
  }

  const editSection = (section: SongSection) => {
    setEditingSection({ ...section })
    setIsEditDialogOpen(true)
  }

  const saveSection = () => {
    if (editingSection) {
      setSections(sections.map((s) => (s.id === editingSection.id ? editingSection : s)))
      const maxEndTime = Math.max(
        ...sections.map((s) => (s.id === editingSection.id ? editingSection.endTime : s.endTime)),
      )
      if (maxEndTime > totalDuration) {
        setTotalDuration(maxEndTime)
      }
      setIsEditDialogOpen(false)
      setEditingSection(null)
    }
  }

  const addSection = () => {
    const lastSection = sections[sections.length - 1]
    const newStartTime = lastSection ? lastSection.endTime : 0
    const colorIndex = sections.length % sectionColors.length
    const newSection: SongSection = {
      id: Date.now().toString(),
      name: "New Section",
      startTime: newStartTime,
      endTime: newStartTime + 30,
      isActive: false,
      color: sectionColors[colorIndex],
      lyrics: [],
    }
    setSections([...sections, newSection])
    setTotalDuration(Math.max(totalDuration, newSection.endTime))
  }

  // Lyrics functions
  const addLyricSentence = (sectionId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          const newSentence: LyricSentence = {
            id: Date.now().toString(),
            text: "",
          }
          return {
            ...section,
            lyrics: [...section.lyrics, newSentence],
          }
        }
        return section
      }),
    )
  }

  const updateLyricSentence = (sectionId: string, sentenceId: string, text: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            lyrics: section.lyrics.map((sentence) => (sentence.id === sentenceId ? { ...sentence, text } : sentence)),
          }
        }
        return section
      }),
    )
  }

  const deleteLyricSentence = (sectionId: string, sentenceId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            lyrics: section.lyrics.filter((sentence) => sentence.id !== sentenceId),
          }
        }
        return section
      }),
    )
  }

  // Timeline interaction
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && !isDraggingSlider) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const percentage = clickX / rect.width
      const newTime = Math.max(0, Math.min(totalDuration, percentage * totalDuration))
      setCurrentTime(Math.floor(newTime))

      const activeSection = sections.find((s) => newTime >= s.startTime && newTime < s.endTime)
      if (activeSection) {
        setSections(sections.map((s) => ({ ...s, isActive: s.id === activeSection.id })))
      }
    }
  }

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSlider(true)

    const handleMouseMove = (e: MouseEvent) => {
      if (progressBarRef.current) {
        const rect = progressBarRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const percentage = Math.max(0, Math.min(1, clickX / rect.width))
        const newTime = percentage * totalDuration
        setCurrentTime(Math.floor(newTime))

        const activeSection = sections.find((s) => newTime >= s.startTime && newTime < s.endTime)
        if (activeSection) {
          setSections(sections.map((s) => ({ ...s, isActive: s.id === activeSection.id })))
        }
      }
    }

    const handleMouseUp = () => {
      setIsDraggingSlider(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Drag and drop (simplified for space)
  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSection(sectionId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", sectionId)
  }

  const handleDragEnd = () => {
    setDraggedSection(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData("text/plain")

    if (draggedId) {
      const draggedIndex = sections.findIndex((s) => s.id === draggedId)
      if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
        const newSections = [...sections]
        const [draggedItem] = newSections.splice(draggedIndex, 1)
        const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex
        newSections.splice(adjustedTargetIndex, 0, draggedItem)

        let currentTime = 0
        const reorderedSections = newSections.map((section) => {
          const duration = section.endTime - section.startTime
          const updatedSection = {
            ...section,
            startTime: currentTime,
            endTime: currentTime + duration,
          }
          currentTime += duration
          return updatedSection
        })

        setSections(reorderedSections)
        setTotalDuration(currentTime)
      }
    }
    setDragOverIndex(null)
    setDraggedSection(null)
  }

  // Auto-select section for lyrics when switching to lyrics tab
  useEffect(() => {
    if (!selectedSectionForLyrics) {
      const activeSection = sections.find((s) => s.isActive)
      if (activeSection) {
        setSelectedSectionForLyrics(activeSection.id)
      }
    }
  }, [selectedSectionForLyrics, sections])

  // Simulate time progression
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && !isDraggingSlider) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = (prev + 1) % totalDuration
          const activeSection = sections.find((s) => newTime >= s.startTime && newTime < s.endTime)
          if (activeSection) {
            setSections(sections.map((s) => ({ ...s, isActive: s.id === activeSection.id })))
          }
          return newTime
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, isDraggingSlider, sections, totalDuration])

  const selectedSection = selectedSectionForLyrics ? sections.find((s) => s.id === selectedSectionForLyrics) : null

  return (
    <div className="w-full min-h-[600px] bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col" data-name="apple-music-root">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-sm"></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Song Production</h3>
            <p className="text-xs text-gray-500">
              {formatTime(totalDuration)} • {sections.length} sections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-mono text-lg font-medium text-gray-900">{formatTime(currentTime)}</div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
              <SkipBack className="h-3.5 w-3.5 text-gray-600" />
            </Button>

            <Button
              onClick={togglePlayback}
              size="icon"
              className={`h-9 w-9 rounded-full transition-all duration-200 ${
                isPlaying ? "bg-gray-900 hover:bg-gray-800" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
              <SkipForward className="h-3.5 w-3.5 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6" data-name="timeline-header">
        <div
          ref={progressBarRef}
          className="w-full bg-gray-100 rounded-full h-3 cursor-pointer relative"
          onClick={handleTimelineClick}
          data-name="timeline-progress-bar"
        >
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
            data-name="timeline-progress-fill"
          />

          <div
            className={`absolute top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 ${
              isDraggingSlider ? "scale-125 shadow-lg" : "hover:scale-110"
            }`}
            style={{ left: `${(currentTime / totalDuration) * 100}%`, marginLeft: "-10px" }}
            onMouseDown={handleSliderMouseDown}
            data-name="timeline-slider-thumb"
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-1 px-1" data-name="timeline-labels">
          <span>0:00</span>
          <span>{formatTime(Math.floor(totalDuration / 2))}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col space-y-6 min-h-0" data-name="main-content">
        {/* Song Sections */}
        <div className="flex-shrink-0" data-name="song-sections-bar">
          <div className="flex items-center justify-between mb-4" data-name="song-sections-bar-header">
            <h4 className="text-sm font-medium text-gray-700">Song Sections</h4>
            <Button onClick={addSection} size="sm" variant="outline" className="h-7 text-xs bg-transparent" data-name="add-section-btn">
              <Plus className="h-3 w-3 mr-1" />
              Add Section
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide h-20" data-name="song-sections-list">
            {sections.map((section, index) => {
              const duration = section.endTime - section.startTime
              const minWidth = 140
              const maxWidth = 220
              const proportionalWidth = Math.max(minWidth, Math.min(maxWidth, (duration / 30) * 140))
              const isDraggedItem = draggedSection === section.id
              const isDropTarget = dragOverIndex === index

              return (
                <div key={section.id} className="flex items-center flex-shrink-0" data-name={`song-section-pill-wrap-${section.id}`}>
                  {isDropTarget && (
                    <div className="w-1 bg-blue-400 rounded-full h-16 mx-1 animate-pulse shadow-md flex-shrink-0" data-name="song-section-drop-target" />
                  )}

                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, section.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`relative rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      section.isActive
                        ? `${section.color} text-white border-white/30 shadow-lg`
                        : selectedSectionForLyrics === section.id
                          ? `bg-blue-50 text-blue-900 border-blue-300 shadow-sm`
                          : `bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm`
                    } ${isDraggedItem ? "opacity-40 scale-95 rotate-2" : ""}`}
                    style={{ width: `${proportionalWidth}px` }}
                    data-name={`song-section-pill-${section.id}`}
                  >
                    <div
                      className={`absolute left-2 top-1/2 transform -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity ${
                        section.isActive
                          ? "text-white/70"
                          : selectedSectionForLyrics === section.id
                            ? "text-blue-600"
                            : "text-gray-400"
                      }`}
                      data-name="song-section-pill-grip"
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>

                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 ${
                              section.isActive
                                ? "text-white/70 hover:text-white hover:bg-white/20"
                                : selectedSectionForLyrics === section.id
                                  ? "text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => editSection(section)} className="cursor-pointer">
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Section
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSelectedSectionForLyrics(section.id)}
                            className="cursor-pointer"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Edit Lyrics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteSection(section.id)}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Section
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="p-3 pl-8 pr-10 h-16 flex items-center">
                      <button
                        onClick={() => {
                          jumpToSection(section.startTime, section.id)
                          setSelectedSectionForLyrics(section.id)
                        }}
                        className="w-full text-left"
                      >
                        <div className="font-medium text-sm mb-1 truncate" title={section.name}>
                          {section.name}
                        </div>
                        <div
                          className={`text-xs ${
                            section.isActive
                              ? "text-white/80"
                              : selectedSectionForLyrics === section.id
                                ? "text-blue-700"
                                : "text-gray-500"
                          }`}
                        >
                          {formatTime(section.startTime)} - {formatTime(section.endTime)}
                        </div>
                      </button>
                    </div>

                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${section.color} rounded-b-xl`} />
                  </div>
                </div>
              )
            })}

            {dragOverIndex === sections.length && (
              <div className="w-1 bg-blue-400 rounded-full h-16 mx-1 animate-pulse shadow-md flex-shrink-0" data-name="song-section-drop-target-end" />
            )}
          </div>
        </div>

        {/* Lyrics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[320px]" data-name="lyrics-section-grid">
          {/* Lyrics Editor */}
          <div className="lg:col-span-2 flex flex-col min-h-0 h-full" data-name="lyrics-editor-col">
            <Card className="flex-1 flex flex-col min-h-0 h-full" data-name="lyrics-editor-card">
              <CardHeader className="pb-3 flex-shrink-0" data-name="lyrics-editor-card-header">
                <div className="flex items-center justify-between" data-name="lyrics-editor-card-header-row">
                  <CardTitle className="text-sm" data-name="lyrics-editor-card-title">
                    {selectedSection ? `Lyrics - ${selectedSection.name}` : "Select a section"}
                  </CardTitle>
                  {selectedSection && (
                    <div className="flex items-center gap-2" data-name="lyrics-editor-card-header-actions">
                      <Button
                        onClick={() => addLyricSentence(selectedSection.id)}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        data-name="add-lyric-line-btn"
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Add Line
                      </Button>
                      <Button
                        onClick={() => setLyricsPreviewMode(!lyricsPreviewMode)}
                        size="sm"
                        variant={lyricsPreviewMode ? "default" : "outline"}
                        className="h-7 text-xs"
                        data-name="toggle-lyrics-preview-btn"
                      >
                        {lyricsPreviewMode ? "Exit Preview" : "Preview"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent
                className="flex-1 flex flex-col min-h-0 h-full p-4"
                style={{ height: undefined }}
                data-name="lyrics-editor-card-content"
              >
                {lyricsPreviewMode ? (
                  <div
                    className="overflow-y-auto scrollbar-hide bg-gray-50 rounded-lg p-4"
                    style={{ minHeight: "320px" }}
                    data-name="lyrics-preview-mode-container"
                  >
                    <div className="space-y-6" data-name="lyrics-preview-mode-list">
                      {sections.map((section) => (
                        <div
                          key={section.id}
                          className={`${selectedSectionForLyrics === section.id ? "bg-blue-50 p-3 rounded-lg border border-blue-200" : "p-2"}`}
                        >
                          <h5 className={`font-medium text-sm ${section.color} py-1 px-2 rounded-md inline-block mb-3`}>
                            {section.name}
                          </h5>
                          <div className="space-y-2">
                            {section.lyrics.length === 0 ? (
                              <p className="text-gray-500 text-sm italic pl-4">No lyrics in this section</p>
                            ) : (
                              section.lyrics.map((sentence, index) => (
                                <div key={sentence.id} className="flex items-start gap-3 pl-4">
                                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 text-gray-800 leading-relaxed">
                                    {sentence.text || <span className="text-gray-400 italic">Empty line</span>}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 min-h-0 h-full scrollbar-hide" style={{ minHeight: "320px" }} data-name="lyrics-scrollarea">
                    <div className="space-y-6 h-full" data-name="lyrics-scrollarea-list">
                      {sections.map((section) => (
                        <div
                          key={section.id}
                          className={`transition-all duration-200 ${selectedSectionForLyrics === section.id ? "bg-blue-50 p-3 rounded-lg border border-blue-200" : "p-2"}`}
                        >
                          <button
                            onClick={() => setSelectedSectionForLyrics(section.id)}
                            className="w-full text-left mb-3"
                          >
                            <h5 className={`font-medium text-sm ${section.color} py-1 px-2 rounded-md inline-block`}>
                              {section.name}
                            </h5>
                          </button>
                          <div className="space-y-3">
                            {section.lyrics.length === 0 ? (
                              <div className="text-center py-4 text-gray-500 pl-4">
                                <p className="text-sm">No lyrics yet</p>
                                <Button
                                  onClick={() => {
                                    setSelectedSectionForLyrics(section.id)
                                    addLyricSentence(section.id)
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                >
                                  Add first line
                                </Button>
                              </div>
                            ) : (
                              section.lyrics.map((sentence, index) => (
                                <div key={sentence.id} className="flex items-start gap-2 pl-4">
                                  <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 mt-1">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <Textarea
                                      value={sentence.text}
                                      onChange={(e) => updateLyricSentence(section.id, sentence.id, e.target.value)}
                                      onFocus={() => setSelectedSectionForLyrics(section.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          e.preventDefault()
                                          addLyricSentence(section.id)
                                          setTimeout(() => {
                                            const textareas = document.querySelectorAll("textarea")
                                            const currentIndex = Array.from(textareas).findIndex(
                                              (ta) => ta === e.target,
                                            )
                                            if (currentIndex !== -1 && textareas[currentIndex + 1]) {
                                              ;(textareas[currentIndex + 1] as HTMLTextAreaElement).focus()
                                            }
                                          }, 50)
                                        }
                                      }}
                                      placeholder="Enter lyric line..."
                                      className="min-h-[40px] max-h-[120px] resize-none overflow-y-auto scrollbar-hide"
                                      rows={1}
                                    />
                                  </div>
                                  <Button
                                    onClick={() => deleteLyricSentence(section.id, sentence.id)}
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-gray-400 hover:text-red-600 mt-1"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))
                            )}
                            <div className="pl-4">
                              <Button
                                onClick={() => {
                                  setSelectedSectionForLyrics(section.id)
                                  addLyricSentence(section.id)
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-gray-500 hover:text-gray-700"
                              >
                                <PlusCircle className="h-3 w-3 mr-1" />
                                Add line to {section.name}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Full Song Lyrics Preview */}
          <div className="lg:col-span-1 flex flex-col min-h-0 h-full" data-name="lyrics-preview-col">
            <Card className="flex-1 flex flex-col min-h-0 h-full" data-name="lyrics-preview-card">
              <CardHeader className="pb-3 flex-shrink-0" data-name="lyrics-preview-card-header">
                <CardTitle className="text-sm" data-name="lyrics-preview-card-title">Full Song Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 h-full" data-name="lyrics-preview-card-content">
                <ScrollArea className="h-full scrollbar-hide" data-name="lyrics-preview-scrollarea">
                  <div className="space-y-4 h-full" data-name="lyrics-preview-scrollarea-list">
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        className={`transition-all duration-200 ${
                          selectedSectionForLyrics === section.id
                            ? "bg-blue-50 p-2 rounded-lg border border-blue-200"
                            : section.isActive
                              ? "bg-gray-50 p-2 rounded-lg border border-gray-200"
                              : ""
                        }`}
                      >
                        <button onClick={() => setSelectedSectionForLyrics(section.id)} className="w-full text-left">
                          <h5 className={`font-medium text-sm ${section.color} py-1 px-2 rounded-md inline-block mb-2`}>
                            {section.name}
                          </h5>
                        </button>
                        <ul className="list-none pl-4 space-y-1">
                          {section.lyrics.map((sentence) => (
                            <li key={sentence.id} className="text-gray-700 text-sm leading-relaxed">
                              {sentence.text || <span className="text-gray-400 italic">Empty line</span>}
                            </li>
                          ))}
                          {section.lyrics.length === 0 && (
                            <li className="text-gray-500 text-sm italic">No lyrics in this section.</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Section Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="section-name">Section Name</Label>
                <Input
                  id="section-name"
                  value={editingSection.name}
                  onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Start Time (seconds)</Label>
                  <Input
                    id="start-time"
                    type="number"
                    value={editingSection.startTime}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        startTime: Math.max(0, Number.parseInt(e.target.value) || 0),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">End Time (seconds)</Label>
                  <Input
                    id="end-time"
                    type="number"
                    value={editingSection.endTime}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        endTime: Math.max(
                          editingSection.startTime + 1,
                          Number.parseInt(e.target.value) || editingSection.startTime + 1,
                        ),
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Section Color</Label>
                <div className="flex gap-2 mt-2">
                  {sectionColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditingSection({ ...editingSection, color })}
                      className={`w-6 h-6 rounded-full ${color} ${
                        editingSection.color === color ? "ring-2 ring-gray-400 ring-offset-2" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveSection}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <style jsx global>{`
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`}</style>
    </div>
  )
}
