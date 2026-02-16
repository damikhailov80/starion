import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const maxDuration = 300; // 5 минут максимум для рендеринга

export async function POST(request: NextRequest) {
  try {
    const { texts, audioSegments, bgVideoUrl } = await request.json();

    // Создаем папку для экспорта если её нет
    const outputDir = join(process.cwd(), 'public', 'exports');
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const outputFileName = `video-${timestamp}.mp4`;

    // Запускаем отдельный Node.js процесс для рендеринга
    const scriptPath = join(process.cwd(), 'scripts/render-video.mjs');
    
    return new Promise((resolve) => {
      const renderProcess = spawn('node', [
        scriptPath,
        JSON.stringify(texts),
        JSON.stringify(audioSegments),
        bgVideoUrl,
        outputFileName
      ], {
        cwd: process.cwd(),
        env: process.env,
      });

      let stdout = '';
      let stderr = '';

      renderProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(output);
      });

      renderProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error(output);
      });

      renderProcess.on('close', (code) => {
        if (code === 0 && stdout.includes('SUCCESS:')) {
          resolve(NextResponse.json({ 
            success: true, 
            url: `/exports/${outputFileName}`,
            message: 'Видео успешно экспортировано'
          }));
        } else {
          resolve(NextResponse.json(
            { 
              success: false, 
              error: stderr || 'Ошибка при рендеринге видео',
              logs: stdout
            },
            { status: 500 }
          ));
        }
      });

      renderProcess.on('error', (error) => {
        resolve(NextResponse.json(
          { 
            success: false, 
            error: error.message 
          },
          { status: 500 }
        ));
      });
    });

  } catch (error) {
    console.error('Render error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      },
      { status: 500 }
    );
  }
}
