
import { useRef } from 'react';
import { SOUNDS, SOUND_VARIATIONS, SoundKey } from '../sounds';

type PlaySoundOptions = {
  volume?: number;
  throttleMs?: number; 
};

class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<SoundKey, AudioBuffer> = new Map();
  private lastPlayed: Map<string, number> = new Map();
  private isLoading = false;
  private isLoaded = false;
  private isInitialized = false;

  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn("AudioPlayer: Web Audio API not supported.");
        return;
      }
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        return;
      }
    }

    this.loadAllSounds();
  }

  private async loadAllSounds() {
    if (this.isLoading || this.isLoaded || !this.audioContext) return;
    this.isLoading = true;

    const soundPromises = Object.entries(SOUNDS).map(async ([key, { src }]) => {
      try {
        if (this.audioBuffers.has(key as SoundKey)) return;
        const response = await fetch(src);
        if (!response.ok) return; // Silent skip for 404s
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.audioBuffers.set(key as SoundKey, audioBuffer);
      } catch (e) {
        // Log errors only in development or as warnings
      }
    });

    await Promise.all(soundPromises);
    this.isLoading = false;
    this.isLoaded = true;
  }

  public playSound = (soundName: string, options: PlaySoundOptions = {}): void => {
    if (!this.isInitialized || !this.audioContext || this.audioContext.state !== 'running') return;

    const now = Date.now();
    if (options.throttleMs) {
      const last = this.lastPlayed.get(soundName) || 0;
      if (now - last < options.throttleMs) return;
      this.lastPlayed.set(soundName, now);
    }

    const soundKeys = SOUND_VARIATIONS[soundName] || [soundName as SoundKey];
    const soundToPlayKey = soundKeys[Math.floor(Math.random() * soundKeys.length)];
    
    const buffer = this.audioBuffers.get(soundToPlayKey);
    const soundInfo = SOUNDS[soundToPlayKey];

    if (buffer && soundInfo) {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      const gainNode = this.audioContext.createGain();
      const finalVolume = options.volume !== undefined ? options.volume : soundInfo.volume;
      gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      source.start(0);
    }
  };
}

export const useSoundManager = () => {
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  if (audioPlayerRef.current === null) {
    audioPlayerRef.current = new AudioPlayer();
  }
  return audioPlayerRef.current;
};
