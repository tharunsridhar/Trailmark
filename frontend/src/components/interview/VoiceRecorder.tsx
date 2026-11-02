'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, AlertCircle, Volume2, Check } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string, durationSeconds: number) => void;
  initialText?: string;
}

export function VoiceRecorder({ onTranscriptionComplete, initialText = '' }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcribedText, setTranscribedText] = useState(initialText);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef(initialText);

  useEffect(() => {
    latestTranscriptRef.current = initialText;
    setTranscribedText(initialText);
  }, [initialText]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    latestTranscriptRef.current = '';
    setTranscribedText('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        // Rebuilding cleanly across all results avoids duplicate words
        recognition.onresult = (event: any) => {
          let sessionFinal = '';
          let sessionInterim = '';
          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) {
              sessionFinal += transcript + ' ';
            } else {
              sessionInterim += transcript;
            }
          }
          const full = (sessionFinal + sessionInterim).trim();
          if (full) {
            latestTranscriptRef.current = full;
            setTranscribedText(full);
          }
        };

        try {
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch {}
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Microphone access denied or unavailable. You can provide a text answer.'
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }

      const textToSend = (latestTranscriptRef.current || transcribedText).trim();
      if (!textToSend) {
        setErrorMessage('No speech detected. Please speak into your microphone or type your response.');
        return;
      }

      onTranscriptionComplete(textToSend, recordingSeconds);
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setIsPlaying(false);
    setTranscribedText('');
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current && audioUrl) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-4 pt-1">
      {errorMessage && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-700 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Voice Control Strip in warm stone styling */}
      <div className="p-4 rounded-2xl border border-[#E6E6DE] bg-[#F4F4F0] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-xs font-semibold shadow-soft transition-all"
            >
              <Mic size={14} />
              {audioUrl ? 'Re-record Voice Answer' : 'Start Recording'}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-700 text-white text-xs font-semibold shadow-soft animate-pulse transition-all"
            >
              <Square size={13} />
              Stop Recording
            </button>
          )}

          {isRecording && (
            <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
              Recording {formatTime(recordingSeconds)}
            </span>
          )}

          {!isRecording && audioUrl && (
            <button
              type="button"
              onClick={togglePlayback}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E6E6DE] text-xs font-medium text-[#1F201B] hover:bg-[#EAEAE2]"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
              <span className="text-[10px] text-[#7A7B72]">({formatTime(recordingSeconds)})</span>
            </button>
          )}

          {audioUrl && (
            <button
              type="button"
              onClick={resetRecording}
              className="p-1.5 text-[#7A7B72] hover:text-[#1F201B] rounded-full hover:bg-[#EAEAE2]"
              title="Discard"
              aria-label="Discard"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        <span className="text-[11px] text-[#7A7B72]">Auto-transcribes into text. Editable before saving.</span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[#1F201B] flex items-center gap-1">
            <Volume2 size={13} className="text-[#5A5B4C]" />
            Transcribed Text & Manual Corrections
          </label>
          {isTranscribing && (
            <span className="text-[11px] text-[#5A5B4C] font-semibold animate-pulse">Transcribing...</span>
          )}
        </div>

        <textarea
          value={transcribedText}
          onChange={(e) => {
            setTranscribedText(e.target.value);
            onTranscriptionComplete(e.target.value, recordingSeconds);
          }}
          rows={3}
          placeholder="Speak or refine the transcribed answer here..."
          className="w-full px-4 py-2.5 rounded-2xl border border-[#E6E6DE] text-xs text-[#1F201B] bg-white placeholder-[#A2A399] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C] resize-none leading-relaxed"
        />
      </div>
    </div>
  );
}
