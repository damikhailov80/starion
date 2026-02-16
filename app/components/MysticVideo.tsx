'use client';
import { AbsoluteFill, OffthreadVideo, Loop, staticFile, useCurrentFrame, interpolate, Sequence, Audio as RemotionAudio, useVideoConfig } from 'remotion';
import { useMemo } from 'react';

type AudioSegment = {
  url: string;
  duration: number; // в секундах
};

export const MysticVideo = ({
  texts = [],
  audioSegments = [],
  bgVideoUrl = "/assets/sample.mp4"
}: {
  texts?: string[],
  audioSegments?: AudioSegment[],
  bgVideoUrl?: string
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Проверка на существование массивов
  if (!texts || texts.length === 0 || !audioSegments || audioSegments.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <h1 style={{ color: 'white' }}>No data provided</h1>
      </AbsoluteFill>
    );
  }

  // Вычисляем стартовые фреймы для каждого сегмента
  const segmentStartFrames = useMemo(() => {
    const starts = [0];
    for (let i = 0; i < audioSegments.length - 1; i++) {
      starts.push(starts[i] + Math.ceil(audioSegments[i].duration * fps));
    }
    return starts;
  }, [audioSegments, fps]);

  // Находим активный текст на основе текущего фрейма
  let activeTextIndex = -1;
  for (let i = segmentStartFrames.length - 1; i >= 0; i--) {
    if (frame >= segmentStartFrames[i]) {
      activeTextIndex = i;
      break;
    }
  }

  const isValidIndex = activeTextIndex >= 0 && activeTextIndex < texts.length;

  // Вычисляем opacity для текущего текста
  const getTextOpacity = () => {
    if (!isValidIndex) return 0;

    const segmentStartFrame = segmentStartFrames[activeTextIndex];
    const segmentDuration = Math.ceil(audioSegments[activeTextIndex].duration * fps);
    const fadeInDuration = 30; // 1 секунда на появление
    const fadeOutDuration = 30; // 1 секунда на исчезновение

    const frameInSegment = frame - segmentStartFrame;

    // Fade in
    if (frameInSegment < fadeInDuration) {
      return interpolate(
        frameInSegment,
        [0, fadeInDuration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
    }

    // Fade out (для всех сегментов, включая последний)
    if (frameInSegment >= segmentDuration - fadeOutDuration) {
      return interpolate(
        frameInSegment,
        [segmentDuration - fadeOutDuration, segmentDuration],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
    }

    return 1;
  };

  // Анимация пульсации свечения
  const getGlowIntensity = () => {
    if (!isValidIndex) return 0;
    const segmentStartFrame = segmentStartFrames[activeTextIndex];
    const frameInSegment = frame - segmentStartFrame;

    return interpolate(
      frameInSegment % 60,
      [0, 30, 60],
      [0.7, 1, 0.7],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  };

  // Анимация масштаба
  const getScale = () => {
    if (!isValidIndex) return 1;
    const segmentStartFrame = segmentStartFrames[activeTextIndex];
    const segmentDuration = Math.ceil(audioSegments[activeTextIndex].duration * fps);
    const fadeInDuration = 30;
    const frameInSegment = frame - segmentStartFrame;

    // Появление с небольшим увеличением
    if (frameInSegment < fadeInDuration) {
      return interpolate(
        frameInSegment,
        [0, fadeInDuration],
        [0.7, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
    }

    return 1;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Loop durationInFrames={300}>
        <OffthreadVideo
          src={staticFile(bgVideoUrl.replace(/^\//, ''))}
          volume={0.3}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Loop>

      {audioSegments.map((segment, index) => (
        <Sequence key={index} from={segmentStartFrames[index]}>
          <RemotionAudio
            src={staticFile(segment.url.replace(/^\//, ''))}
            volume={1}
          />
        </Sequence>
      ))}

      <AbsoluteFill style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 40px'
      }}>
        {isValidIndex && (
          <h1 style={{
            color: 'white',
            fontSize: 80,
            textShadow: `
              0 0 ${30 * getGlowIntensity()}px rgba(255, 255, 100, ${0.9 * getGlowIntensity()}),
              0 0 ${60 * getGlowIntensity()}px rgba(255, 255, 100, ${0.7 * getGlowIntensity()}),
              0 8px 20px rgba(0, 0, 0, 0.95),
              0 4px 10px rgba(0, 0, 0, 0.9)
            `,
            fontWeight: 900,
            lineHeight: 1.1,
            opacity: getTextOpacity(),
            fontFamily: 'Arial, Helvetica, sans-serif',
            letterSpacing: '0.02em',
            textTransform: 'uppercase' as const,
            transform: `scale(${getScale()})`
          }}>
            {texts[activeTextIndex]}
          </h1>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
