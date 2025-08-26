import { useRef } from 'react';
import { SOUNDS, SOUND_VARIATIONS, SoundKey } from '../sounds';

type PlaySoundOptions = {
  volume?: number;
  throttleMs?: number; // Prevent this sound from playing again for X ms
};

class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<SoundKey, AudioBuffer> = new Map();
  private lastPlayed: Map<string, number> = new Map();
  private isLoading = false;
  private isLoaded = false;
  private isInitialized = false;

  constructor() {
    // Constructor is kept lightweight. Initialization happens in init().
  }

  // This method MUST be called from a user gesture handler.
  public async init() {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true; // Set immediately to prevent multiple concurrent inits

    // Create context if it doesn't exist.
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("AudioPlayer: Web Audio API is not supported.", e);
        return;
      }
    }

    // Try to resume if suspended. This is the critical part that needs a user gesture.
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log("AudioPlayer: AudioContext resumed successfully.");
      } catch (e) {
        console.error("AudioPlayer: Failed to resume AudioContext. Sounds may not play.", e);
        return; // Don't proceed if context can't be started.
      }
    }

    // If we've reached here, context is running.
    this.loadAllSounds(); // Start loading in the background.
  }


  private async loadAllSounds() {
    if (this.isLoading || this.isLoaded || !this.audioContext) return;

    this.isLoading = true;
    console.log('AudioPlayer: Initializing and loading sounds...');

    const soundPromises = Object.entries(SOUNDS).map(async ([key, { src }]) => {
      try {
        if (this.audioBuffers.has(key as SoundKey)) return;

        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for ${src}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

        this.audioBuffers.set(key as SoundKey, audioBuffer);
      } catch (e) {
        console.error(`AudioPlayer: Failed to load sound: ${key}`, e);
      }
    });

    await Promise.all(soundPromises);
    this.isLoading = false;
    this.isLoaded = true;
    console.log('AudioPlayer: All sounds loaded.');
  }

  public playSound = (soundName: string, options: PlaySoundOptions = {}): void => {
    if (!this.isInitialized || !this.audioContext) {
      // This is expected before the first user interaction.
      // We keep it silent to avoid spamming the console.
      return;
    }

    if (this.audioContext.state !== 'running') {
      console.warn(`AudioPlayer: Cannot play "${soundName}". AudioContext is not running (state: ${this.audioContext.state}). A user interaction is required to start audio.`);
      return;
    }

    const now = Date.now();
    if (options.throttleMs) {
      const last = this.lastPlayed.get(soundName) || 0;
      if (now - last < options.throttleMs) {
        return;
      }
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
    } else {
      // This section provides detailed diagnostics for why a sound might not play.
      if (this.isLoaded && !buffer) {
        // The most critical error: loading is done, but the sound isn't available.
        console.error(`AudioPlayer: Cannot play "${soundToPlayKey}". The sound buffer is missing. This is likely due to a 404 Not Found error during loading. Please check the sound file path in sounds.ts.`);
      } else if (this.isLoading) {
        // Sounds are still loading in the background. This is a normal occurrence at the start.
        // console.log(`AudioPlayer: Sound "${soundToPlayKey}" not played because audio is still loading.`);
      } else if (!this.isLoading && !this.isLoaded && this.isInitialized) {
        // This case indicates that the loading process never started, pointing to an issue.
        console.warn(`AudioPlayer: Cannot play "${soundToPlayKey}" because the sound system is not loaded, despite being initialized.`);
      }
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