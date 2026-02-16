'use client';
import { Player } from "@remotion/player";
import { MysticVideo } from "./components/MysticVideo";
import { useState } from "react";
import { defaultVideoConfig } from "./config/videoConfig";

export default function Home() {
  const [isRendering, setIsRendering] = useState(false);

  const inputProps = defaultVideoConfig;

  const handleExport = async () => {
    setIsRendering(true);

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputProps),
      });

      const data = await response.json();

      if (data.success) {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = `mystic-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // alert('Видео успешно экспортировано!');
      } else {
        alert(`Ошибка: ${data.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Ошибка при экспорте видео');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <main style={{ position: 'relative' }}>
      <Player
        loop
        component={MysticVideo}
        durationInFrames={465}
        compositionWidth={1080}
        compositionHeight={1920}
        fps={30}
        inputProps={inputProps}
        style={{
          width: '100%',
          height: '100vh'
        }}
        controls
        acknowledgeRemotionLicense
      />
      <button
        onClick={handleExport}
        disabled={isRendering}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '15px 30px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: isRendering ? '#666' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isRendering ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
        }}
      >
        {isRendering ? 'Экспорт...' : 'Скачать видео'}
      </button>
    </main>
  );
}