import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

async function render() {
  try {
    // Получаем параметры из аргументов командной строки
    const args = process.argv.slice(2);
    const texts = JSON.parse(args[0]);
    const audioSegments = JSON.parse(args[1]);
    const bgVideoUrl = args[2];
    const outputFileName = args[3];

    if (!texts || !audioSegments || !bgVideoUrl || !outputFileName) {
      console.error('Missing arguments');
      process.exit(1);
    }

    const projectRoot = path.resolve(__dirname, '..');
    const entryPoint = path.join(projectRoot, 'remotion/index.ts');
    
    console.log('Bundling composition...');
    const bundleLocation = await bundle({
      entryPoint,
      webpackOverride: (config) => config,
    });

    const inputProps = {
      texts,
      audioSegments,
      bgVideoUrl,
    };

    console.log('Selecting composition...');
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MysticVideo',
      inputProps,
    });

    const outputPath = path.join(projectRoot, 'public/exports', outputFileName);

    console.log('Rendering video...');
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      audioCodec: 'aac',
      onProgress: ({ progress }) => {
        console.log(`Progress: ${Math.round(progress * 100)}%`);
      },
    });

    console.log('SUCCESS:' + outputFileName);
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

render();
