import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import { SongSection } from './SongwriterTool';
import { toast } from '@/hooks/use-toast';

interface ExportDialogProps {
  sections: SongSection[];
  audioFile: File | null;
  selectedLanguage?: string;
}

// Translation dictionary for ExportDialog
const translations: Record<string, Record<string, string>> = {
  en: {
    exportLyrics: 'Export Lyrics',
    exportOptions: 'Export Options',
    includeTimestamps: 'Include timestamps',
    includeRhymes: 'Include rhyme analysis',
    separateFiles: 'Export each section as separate file',
    export: 'Export',
    noContentToExport: 'No content to export',
    noContentToExportDesc: 'Add some sections and lyrics first.',
    exportSuccessful: 'Export successful!',
    exportSuccessfulDesc: 'Your lyrics have been downloaded as a text file.',
    untitledSong: 'Untitled Song',
    noLyrics: '[No lyrics]',
    rhymeWords: 'Rhyme words:'
  },
  it: {
    exportLyrics: 'Esporta Testo',
    exportOptions: 'Opzioni di Esportazione',
    includeTimestamps: 'Includi timestamp',
    includeRhymes: 'Includi analisi delle rime',
    separateFiles: 'Esporta ogni sezione come file separato',
    export: 'Esporta',
    noContentToExport: 'Nessun contenuto da esportare',
    noContentToExportDesc: 'Aggiungi prima alcune sezioni e testo.',
    exportSuccessful: 'Esportazione riuscita!',
    exportSuccessfulDesc: 'Il tuo testo è stato scaricato come file di testo.',
    untitledSong: 'Canzone Senza Titolo',
    noLyrics: '[Nessun testo]',
    rhymeWords: 'Parole che fanno rima:'
  },
  es: {
    exportLyrics: 'Exportar Letra',
    exportOptions: 'Opciones de Exportación',
    includeTimestamps: 'Incluir marcas de tiempo',
    includeRhymes: 'Incluir análisis de rimas',
    separateFiles: 'Exportar cada sección como archivo separado',
    export: 'Exportar',
    noContentToExport: 'No hay contenido para exportar',
    noContentToExportDesc: 'Agrega algunas secciones y letras primero.',
    exportSuccessful: '¡Exportación exitosa!',
    exportSuccessfulDesc: 'Tu letra ha sido descargada como archivo de texto.',
    untitledSong: 'Canción Sin Título',
    noLyrics: '[Sin letra]',
    rhymeWords: 'Palabras que riman:'
  },
  fr: {
    exportLyrics: 'Exporter les Paroles',
    exportOptions: 'Options d\'Exportation',
    includeTimestamps: 'Inclure les horodatages',
    includeRhymes: 'Inclure l\'analyse des rimes',
    separateFiles: 'Exporter chaque section comme fichier séparé',
    export: 'Exporter',
    noContentToExport: 'Aucun contenu à exporter',
    noContentToExportDesc: 'Ajoutez d\'abord quelques sections et paroles.',
    exportSuccessful: 'Exportation réussie !',
    exportSuccessfulDesc: 'Vos paroles ont été téléchargées comme fichier texte.',
    untitledSong: 'Chanson Sans Titre',
    noLyrics: '[Pas de paroles]',
    rhymeWords: 'Mots qui riment :'
  },
  de: {
    exportLyrics: 'Text Exportieren',
    exportOptions: 'Exportoptionen',
    includeTimestamps: 'Zeitstempel einschließen',
    includeRhymes: 'Reimanalyse einschließen',
    separateFiles: 'Jeden Abschnitt als separate Datei exportieren',
    export: 'Exportieren',
    noContentToExport: 'Kein Inhalt zum Exportieren',
    noContentToExportDesc: 'Fügen Sie zuerst einige Abschnitte und Texte hinzu.',
    exportSuccessful: 'Export erfolgreich!',
    exportSuccessfulDesc: 'Ihr Text wurde als Textdatei heruntergeladen.',
    untitledSong: 'Unbenanntes Lied',
    noLyrics: '[Kein Text]',
    rhymeWords: 'Reimwörter:'
  }
};

function t(lang: string, key: string): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
}

export const ExportDialog = ({ sections, audioFile, selectedLanguage = 'en' }: ExportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeTimestamps: true,
    includeRhymes: true,
    separateFiles: false
  });

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const detectRhymes = (text: string) => {
    // Simple rhyme detection - extract last words of each line
    const lines = text.split('\n').filter(line => line.trim());
    const lastWords = lines.map(line => {
      const words = line.trim().split(/\s+/);
      return words[words.length - 1]?.toLowerCase().replace(/[^a-z]/g, '') || '';
    });
    
    // Find rhyming words (simple implementation)
    const rhymes: string[] = [];
    for (let i = 0; i < lastWords.length; i++) {
      for (let j = i + 1; j < lastWords.length; j++) {
        if (lastWords[i] && lastWords[j] && lastWords[i] === lastWords[j]) {
          if (!rhymes.includes(lastWords[i])) {
            rhymes.push(lastWords[i]);
          }
        }
      }
    }
    
    return rhymes;
  };

  const generateTextContent = () => {
    const songTitle = audioFile ? audioFile.name.replace(/\.[^/.]+$/, '') : t(selectedLanguage, 'untitledSong');
    let content = `${songTitle}\n${'='.repeat(songTitle.length)}\n\n`;

    if (exportOptions.separateFiles) {
      // Export each section separately
      sections.forEach(section => {
        let sectionContent = `${section.name}\n${'-'.repeat(section.name.length)}\n\n`;
        
        if (exportOptions.includeTimestamps) {
          sectionContent += `Time: ${formatTime(section.startTime)} - ${formatTime(section.endTime)}\n\n`;
        }

        if (section.lyrics) {
          sectionContent += `${section.lyrics}\n\n`;
          
          if (exportOptions.includeRhymes) {
            const rhymes = detectRhymes(section.lyrics);
            if (rhymes.length > 0) {
              sectionContent += `${t(selectedLanguage, 'rhymeWords')} ${rhymes.join(', ')}\n\n`;
            }
          }
        } else {
          sectionContent += `${t(selectedLanguage, 'noLyrics')}\n\n`;
        }

        // Download individual section file
        const blob = new Blob([sectionContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${songTitle} - ${section.name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } else {
      // Export all sections in one file
      sections.forEach((section, index) => {
        content += `${section.name}\n${'-'.repeat(section.name.length)}\n\n`;
        
        if (exportOptions.includeTimestamps) {
          content += `Time: ${formatTime(section.startTime)} - ${formatTime(section.endTime)}\n\n`;
        }

        if (section.lyrics) {
          content += `${section.lyrics}\n\n`;
          
          if (exportOptions.includeRhymes) {
            const rhymes = detectRhymes(section.lyrics);
            if (rhymes.length > 0) {
              content += `${t(selectedLanguage, 'rhymeWords')} ${rhymes.join(', ')}\n\n`;
            }
          }
        } else {
          content += `${t(selectedLanguage, 'noLyrics')}\n\n`;
        }

        if (index < sections.length - 1) {
          content += '\n';
        }
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${songTitle} - Lyrics.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExport = () => {
    if (sections.length === 0) {
      toast({
        title: t(selectedLanguage, 'noContentToExport'),
        description: t(selectedLanguage, 'noContentToExportDesc'),
        variant: "destructive"
      });
      return;
    }

    generateTextContent();
    setIsOpen(false);
    
    toast({
      title: t(selectedLanguage, 'exportSuccessful'),
      description: t(selectedLanguage, 'exportSuccessfulDesc')
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} data-name="export-dialog-root">
      <DialogTrigger asChild data-name="export-dialog-trigger-btn">
        <Button variant="outline" className="flex items-center gap-2" data-name="export-dialog-trigger-btn">
          <Download className="w-4 h-4" />
          {t(selectedLanguage, 'exportLyrics')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-name="export-dialog-content">
        <DialogHeader data-name="export-dialog-header">
          <DialogTitle>{t(selectedLanguage, 'exportOptions')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4" data-name="export-dialog-body">
          <div className="flex items-center space-x-2" data-name="export-dialog-timestamps">
            <Checkbox
              id="timestamps"
              checked={exportOptions.includeTimestamps}
              onCheckedChange={(checked) =>
                setExportOptions(prev => ({ ...prev, includeTimestamps: checked as boolean }))
              }
            />
            <Label htmlFor="timestamps">{t(selectedLanguage, 'includeTimestamps')}</Label>
          </div>
          <div className="flex items-center space-x-2" data-name="export-dialog-rhymes">
            <Checkbox
              id="rhymes"
              checked={exportOptions.includeRhymes}
              onCheckedChange={(checked) =>
                setExportOptions(prev => ({ ...prev, includeRhymes: checked as boolean }))
              }
            />
            <Label htmlFor="rhymes">{t(selectedLanguage, 'includeRhymes')}</Label>
          </div>
          <div className="flex items-center space-x-2" data-name="export-dialog-separate">
            <Checkbox
              id="separate"
              checked={exportOptions.separateFiles}
              onCheckedChange={(checked) =>
                setExportOptions(prev => ({ ...prev, separateFiles: checked as boolean }))
              }
            />
            <Label htmlFor="separate">{t(selectedLanguage, 'separateFiles')}</Label>
          </div>
          <Button onClick={handleExport} className="w-full" data-name="export-dialog-export-btn">
            {t(selectedLanguage, 'export')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};