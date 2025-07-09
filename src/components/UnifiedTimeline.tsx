import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SongSection } from './SongwriterTool';
import { Play, Pause, Plus, Edit3, Trash2, SkipBack, SkipForward, GripVertical, MoreHorizontal, Music } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface UnifiedTimelineProps {
  sections: SongSection[];
  currentTime: number;
  duration: number;
  currentSection: string | null;
  onSectionClick: (sectionId: string) => void;
  onSectionsUpdate: (sections: SongSection[]) => void;
  setCurrentSection: (sectionId: string) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  audioUrl: string;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  audioFile?: File;
  selectedLanguage?: string;
}

// Translation dictionary for UnifiedTimeline
const translations: Record<string, Record<string, string>> = {
  en: {
    previousSection: 'Previous section',
    pause: 'Pause',
    play: 'Play',
    nextSection: 'Next section',
    playSection: 'Play {section}',
    editSection: 'Edit section',
    deleteSection: 'Delete section',
    addSection: 'Add Section',
    editSectionTitle: 'Edit Section',
    addNewSectionTitle: 'Add New Section',
    sectionName: 'Section Name',
    sectionNamePlaceholder: 'e.g., Verse 1, Chorus, Bridge',
    startTime: 'Start Time (seconds)',
    endTime: 'End Time (seconds)',
    cancel: 'Cancel',
    update: 'Update',
    add: 'Add',
    startTimeBeforeEndTime: 'Start time must be before end time',
    songSections: 'Song Sections'
  },
  it: {
    previousSection: 'Sezione precedente',
    pause: 'Pausa',
    play: 'Riproduci',
    nextSection: 'Sezione successiva',
    playSection: 'Riproduci {section}',
    editSection: 'Modifica sezione',
    deleteSection: 'Elimina sezione',
    addSection: 'Aggiungi Sezione',
    editSectionTitle: 'Modifica Sezione',
    addNewSectionTitle: 'Aggiungi Nuova Sezione',
    sectionName: 'Nome Sezione',
    sectionNamePlaceholder: 'es. Strofa 1, Ritornello, Ponte',
    startTime: 'Tempo Inizio (secondi)',
    endTime: 'Tempo Fine (secondi)',
    cancel: 'Annulla',
    update: 'Aggiorna',
    add: 'Aggiungi',
    startTimeBeforeEndTime: 'Il tempo di inizio deve essere prima del tempo di fine',
    songSections: 'Sezioni della canzone'
  },
  es: {
    previousSection: 'Sección anterior',
    pause: 'Pausa',
    play: 'Reproducir',
    nextSection: 'Siguiente sección',
    playSection: 'Reproducir {section}',
    editSection: 'Editar sección',
    deleteSection: 'Eliminar sección',
    addSection: 'Agregar Sección',
    editSectionTitle: 'Editar Sección',
    addNewSectionTitle: 'Agregar Nueva Sección',
    sectionName: 'Nombre de Sección',
    sectionNamePlaceholder: 'ej. Verso 1, Coro, Puente',
    startTime: 'Tiempo de Inicio (segundos)',
    endTime: 'Tiempo de Fin (segundos)',
    cancel: 'Cancelar',
    update: 'Actualizar',
    add: 'Agregar',
    startTimeBeforeEndTime: 'El tiempo de inicio debe ser antes del tiempo de fin',
    songSections: 'Secciones de la canción'
  },
  fr: {
    previousSection: 'Section précédente',
    pause: 'Pause',
    play: 'Lecture',
    nextSection: 'Section suivante',
    playSection: 'Lecture {section}',
    editSection: 'Modifier la section',
    deleteSection: 'Supprimer la section',
    addSection: 'Ajouter une Section',
    editSectionTitle: 'Modifier la Section',
    addNewSectionTitle: 'Ajouter une Nouvelle Section',
    sectionName: 'Nom de la Section',
    sectionNamePlaceholder: 'ex. Couplet 1, Refrain, Pont',
    startTime: 'Temps de Début (secondes)',
    endTime: 'Temps de Fin (secondes)',
    cancel: 'Annuler',
    update: 'Mettre à jour',
    add: 'Ajouter',
    startTimeBeforeEndTime: 'Le temps de début doit être avant le temps de fin',
    songSections: 'Sections de la chanson'
  },
  de: {
    previousSection: 'Vorheriger Abschnitt',
    pause: 'Pause',
    play: 'Abspielen',
    nextSection: 'Nächster Abschnitt',
    playSection: '{section} abspielen',
    editSection: 'Abschnitt bearbeiten',
    deleteSection: 'Abschnitt löschen',
    addSection: 'Abschnitt Hinzufügen',
    editSectionTitle: 'Abschnitt Bearbeiten',
    addNewSectionTitle: 'Neuen Abschnitt Hinzufügen',
    sectionName: 'Abschnittsname',
    sectionNamePlaceholder: 'z.B. Strophe 1, Refrain, Bridge',
    startTime: 'Startzeit (Sekunden)',
    endTime: 'Endzeit (Sekunden)',
    cancel: 'Abbrechen',
    update: 'Aktualisieren',
    add: 'Hinzufügen',
    startTimeBeforeEndTime: 'Startzeit muss vor Endzeit liegen',
    songSections: 'Liedabschnitte'
  }
};

function t(lang: string, key: string, params?: Record<string, string>): string {
  let text = translations[lang]?.[key] || translations['en'][key] || key;
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, value);
    });
  }
  return text;
}

export const UnifiedTimeline = ({
  sections,
  currentTime,
  duration,
  currentSection,
  onSectionClick,
  onSectionsUpdate,
  setCurrentSection,
  audioRef,
  audioUrl,
  isPlaying,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  audioFile,
  selectedLanguage = 'en'
}: UnifiedTimelineProps) => {
  console.log('MUSIC ICON:', Music);
  const [editingSection, setEditingSection] = useState<SongSection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startTime: 0,
    endTime: 30
  });

  const progressPercentage = useMemo(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const autoAdjustSectionTimes = (sectionList: SongSection[], changedSectionId: string) => {
    const sortedSections = [...sectionList].sort((a, b) => a.startTime - b.startTime);
    const changedIndex = sortedSections.findIndex(s => s.id === changedSectionId);
    
    if (changedIndex === -1) return sectionList;
    
    const changedSection = sortedSections[changedIndex];
    
    // Adjust previous section's end time to match this section's start time
    if (changedIndex > 0) {
      sortedSections[changedIndex - 1].endTime = changedSection.startTime;
    }
    
    // Adjust next section's start time to match this section's end time
    if (changedIndex < sortedSections.length - 1) {
      sortedSections[changedIndex + 1].startTime = changedSection.endTime;
    }
    
    return sortedSections;
  };

  const handleAddSection = () => {
    setEditingSection(null);
    const lastSection = sections.sort((a, b) => a.startTime - b.startTime).pop();
    const startTime = lastSection ? lastSection.endTime : 0;
    setFormData({ name: '', startTime, endTime: startTime + 30 });
    setIsDialogOpen(true);
  };

  const handleEditSection = (section: SongSection) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
      startTime: section.startTime,
      endTime: section.endTime
    });
    setIsDialogOpen(true);
  };

  const checkForOverlap = (newSection: { startTime: number; endTime: number; id?: string }) => {
    return sections.some(section => {
      // Skip checking against the section being edited
      if (editingSection && section.id === editingSection.id) return false;
      
      // Check if new section overlaps with existing section
      const newStart = newSection.startTime;
      const newEnd = newSection.endTime;
      const existingStart = section.startTime;
      const existingEnd = section.endTime;
      
      // Check for any overlap:
      // 1. New section starts during existing section
      // 2. New section ends during existing section  
      // 3. New section completely encompasses existing section
      // 4. Existing section completely encompasses new section
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd) ||
        (existingStart <= newStart && existingEnd >= newEnd)
      );
    });
  };

  const handleSaveSection = () => {
    if (!formData.name.trim()) return;
    
    // Validate that start time is before end time
    if (formData.startTime >= formData.endTime) {
      alert(t(selectedLanguage, 'startTimeBeforeEndTime'));
      return;
    }

    if (editingSection) {
      // First, update the edited section
      let updatedSections = sections.map(section =>
        section.id === editingSection.id
          ? { ...section, ...formData }
          : section
      );

      // Auto-adjust any overlapping sections
      updatedSections = updatedSections.map(section => {
        if (section.id === editingSection.id) return section;
        
        // Check if this section overlaps with the edited section
        const editedSection = updatedSections.find(s => s.id === editingSection.id)!;
        
        // If current section overlaps with edited section, adjust it
        if (section.startTime < editedSection.endTime && section.endTime > editedSection.startTime) {
          // If edited section completely encompasses this section, remove overlap by adjusting times
          if (editedSection.startTime <= section.startTime && editedSection.endTime >= section.endTime) {
            return { ...section, startTime: editedSection.endTime, endTime: editedSection.endTime + (section.endTime - section.startTime) };
          }
          // If this section starts before edited section but overlaps
          else if (section.startTime < editedSection.startTime) {
            return { ...section, endTime: editedSection.startTime };
          }
          // If this section starts after edited section start but before its end
          else {
            return { ...section, startTime: editedSection.endTime };
          }
        }
        
        return section;
      });
      
      onSectionsUpdate(updatedSections);
    } else {
      const newSection: SongSection = {
        id: Date.now().toString(),
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        lyrics: ''
      };
      
      // Auto-adjust any overlapping sections with the new section
      let updatedSections = [...sections, newSection];
      updatedSections = updatedSections.map(section => {
        if (section.id === newSection.id) return section;
        
        // Check if this section overlaps with the new section
        if (section.startTime < newSection.endTime && section.endTime > newSection.startTime) {
          // If new section completely encompasses this section
          if (newSection.startTime <= section.startTime && newSection.endTime >= section.endTime) {
            return { ...section, startTime: newSection.endTime, endTime: newSection.endTime + (section.endTime - section.startTime) };
          }
          // If this section starts before new section but overlaps
          else if (section.startTime < newSection.startTime) {
            return { ...section, endTime: newSection.startTime };
          }
          // If this section starts after new section start but before its end
          else {
            return { ...section, startTime: newSection.endTime };
          }
        }
        
        return section;
      });
      
      onSectionsUpdate(updatedSections);
    }

    setIsDialogOpen(false);
    setEditingSection(null);
  };

  const handleDeleteSection = (sectionId: string) => {
    const updatedSections = sections.filter(s => s.id !== sectionId);
    onSectionsUpdate(updatedSections);
    
    if (currentSection === sectionId && updatedSections.length > 0) {
      setCurrentSection(updatedSections[0].id);
    }
  };

  const getSectionColors = (index: number) => {
    const colors = [
      'bg-blue-500/20 border-blue-500/30 text-blue-700',
      'bg-green-500/20 border-green-500/30 text-green-700',
      'bg-yellow-500/20 border-yellow-500/30 text-yellow-700',
      'bg-red-500/20 border-red-500/30 text-red-700',
      'bg-purple-500/20 border-purple-500/30 text-purple-700',
      'bg-pink-500/20 border-pink-500/30 text-pink-700',
      'bg-indigo-500/20 border-indigo-500/30 text-indigo-700',
      'bg-orange-500/20 border-orange-500/30 text-orange-700'
    ];
    return colors[index % colors.length];
  };

  // Audio controls
  const handlePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioRef, isPlaying, setIsPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, [audioRef, setCurrentTime]);

  const navigateToSection = useCallback((direction: 'prev' | 'next') => {
    const sortedSections = [...sections].sort((a, b) => a.startTime - b.startTime);
    const currentIndex = sortedSections.findIndex(s => s.id === currentSection);
    
    if (direction === 'prev' && currentIndex > 0) {
      const prevSection = sortedSections[currentIndex - 1];
      setCurrentSection(prevSection.id);
      onSectionClick(prevSection.id);
    } else if (direction === 'next' && currentIndex < sortedSections.length - 1) {
      const nextSection = sortedSections[currentIndex + 1];
      setCurrentSection(nextSection.id);
      onSectionClick(nextSection.id);
    }
  }, [sections, currentSection, setCurrentSection, onSectionClick]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef, setCurrentTime, setDuration, setIsPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault(); // Prevent page scroll
        handlePlay();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlay]);

  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => a.startTime - b.startTime);
  }, [sections]);

  // Modern Pill-Style Timeline Section
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSectionId(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId);
  };

  const handleDragEnd = () => {
    setDraggedSectionId(null);
    setDragOverSectionId(null);
  };

  // Fix for dataset typing
  type DivWithDataset = HTMLDivElement & { dataset: DOMStringMap };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverSectionId(null);
    const targetElement = e.currentTarget as DivWithDataset;
    if (targetElement && targetElement.dataset && targetElement.dataset.sectionId) {
      setDragOverSectionId(targetElement.dataset.sectionId);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const draggedId = draggedSectionId;
    const overId = dragOverSectionId;

    if (!draggedId || !overId) return;

    const draggedSection = sections.find(s => s.id === draggedId);
    const overSection = sections.find(s => s.id === overId);

    if (!draggedSection || !overSection) return;

    const draggedIndex = sections.findIndex(s => s.id === draggedId);
    const overIndex = sections.findIndex(s => s.id === overId);

    if (draggedIndex === -1 || overIndex === -1) return;

    const newSections = [...sections];
    const [movedSection] = newSections.splice(draggedIndex, 1);
    newSections.splice(overIndex, 0, movedSection);

    onSectionsUpdate(newSections);

    setDraggedSectionId(null);
    setDragOverSectionId(null);
  };

  const handleDragLeave = () => {
    setDragOverSectionId(null);
  };

  // Show empty state if no sections
  if (sections.length === 0) {
    return (
      <div className="space-y-6">
        <audio ref={audioRef} src={audioUrl} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t(selectedLanguage, 'songSections')}</h3>
            <p className="text-sm text-muted-foreground">Create sections to organize your song structure</p>
          </div>
          <Button onClick={handleAddSection} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            {t(selectedLanguage, 'addSection')}
          </Button>
        </div>

        {/* Empty state */}
        <div className="text-center py-16 bg-card/50 rounded-xl border border-border">
          <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h4 className="text-lg font-medium text-foreground mb-2">No sections defined</h4>
          <p className="text-muted-foreground mb-6">Add sections to see your song timeline</p>
          <Button onClick={handleAddSection} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create First Section
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <audio ref={audioRef} src={audioUrl} />
      
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">{t(selectedLanguage, 'songSections')}</h3>
          <p className="text-sm text-muted-foreground">
            Navigate through your song • {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Navigation controls */}
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigateToSection('prev')}
              disabled={!currentSection || sortedSections.findIndex(s => s.id === currentSection) === 0}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button 
              variant={isPlaying ? "secondary" : "primary"}
              size="sm"
              onClick={handlePlay}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigateToSection('next')}
              disabled={!currentSection || sortedSections.findIndex(s => s.id === currentSection) === sortedSections.length - 1}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={handleAddSection} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            {t(selectedLanguage, 'addSection')}
          </Button>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="relative bg-card/50 rounded-xl p-4 border border-border">
        <div className="h-3 bg-muted/30 rounded-full relative overflow-hidden mb-2">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
          <div
            className="absolute top-0 w-1 h-full bg-primary shadow-lg transition-all duration-200"
            style={{ left: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0:00</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Sections List */}
      <div className="grid gap-3">
        {sortedSections.map((section, index) => {
          const isActive = currentSection === section.id;
          const sectionProgress = duration > 0 ? 
            Math.max(0, Math.min(100, ((currentTime - section.startTime) / (section.endTime - section.startTime)) * 100)) : 0;
          const isPlaying = currentTime >= section.startTime && currentTime <= section.endTime;
          const colorClass = getSectionColors(index);

          return (
            <Card 
              key={section.id}
              className={cn(
                "relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg group border-2",
                isActive ? "ring-2 ring-primary shadow-lg scale-[1.02] border-primary" : "hover:scale-[1.01] border-border"
              )}
              onClick={() => { setCurrentSection(section.id); onSectionClick(section.id); }}
            >
              {/* Section Progress Background */}
              {isPlaying && (
                <div
                  className="absolute inset-0 bg-primary/10 transition-all duration-200"
                  style={{ width: `${sectionProgress}%` }}
                />
              )}

              <div className="p-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Color indicator */}
                    <div className={cn("w-4 h-4 rounded-full flex-shrink-0", colorClass)} />
                    
                    {/* Section Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-semibold text-lg truncate mb-1",
                        isActive ? "text-primary" : "text-foreground"
                      )}>
                        {section.name}
                      </h4>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <span>{formatTime(section.startTime)} - {formatTime(section.endTime)}</span>
                        <span>•</span>
                        <span>{formatTime(section.endTime - section.startTime)} duration</span>
                        {section.lyrics && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">
                              {section.lyrics.split('\n')[0] || 'No lyrics'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant={isActive ? "primary" : "outline"}
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentSection(section.id);
                          onSectionClick(section.id);
                        }}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        {t(selectedLanguage, 'play')}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                          <DropdownMenuItem onClick={() => handleEditSection(section)} className="cursor-pointer">
                            <Edit3 className="h-4 w-4 mr-2" />
                            {t(selectedLanguage, 'editSection')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteSection(section.id)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t(selectedLanguage, 'deleteSection')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Section Progress Bar (when playing) */}
                {isPlaying && (
                  <div className="mt-3">
                    <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-200"
                        style={{ width: `${sectionProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {/* Dialog per edit/add section (come prima) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/20">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingSection ? t(selectedLanguage, 'editSectionTitle') : t(selectedLanguage, 'addNewSectionTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="section-name" className="text-foreground">{t(selectedLanguage, 'sectionName')}</Label>
              <Input
                id="section-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t(selectedLanguage, 'sectionNamePlaceholder')}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time" className="text-foreground">{t(selectedLanguage, 'startTime')}</Label>
                <Input
                  id="start-time"
                  type="number"
                  value={formData.startTime === 0 ? '' : formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value === '' ? 0 : Number(e.target.value) }))}
                  onFocus={(e) => e.target.select()}
                  className="bg-background/50 border-border/50"
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="end-time" className="text-foreground">{t(selectedLanguage, 'endTime')}</Label>
                <Input
                  id="end-time"
                  type="number"
                  value={formData.endTime === 0 ? '' : formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value === '' ? 0 : Number(e.target.value) }))}
                  onFocus={(e) => e.target.select()}
                  className="bg-background/50 border-border/50"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t(selectedLanguage, 'cancel')}
              </Button>
              <Button onClick={handleSaveSection} className="bg-[color:var(--accent)] text-white">
                {editingSection ? t(selectedLanguage, 'update') : t(selectedLanguage, 'add')} {t(selectedLanguage, 'sectionName').toLowerCase()}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};