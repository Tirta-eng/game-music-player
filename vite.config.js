import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Color palette for songs (cycles through these)
const SONG_COLORS = [
  '#4FC3F7', '#0288D1', '#01579B', '#00BCD4', '#009688',
  '#26A69A', '#66BB6A', '#FF7043', '#AB47BC', '#EC407A',
  '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA', '#FFA726',
];

/**
 * Vite plugin: Auto-generate songs manifest from public/songs/ folder.
 *
 * Naming convention for MP3 files:
 *   "Title - Artist.mp3"  →  { title: "Title", artist: "Artist" }
 *   "Title.mp3"           →  { title: "Title", artist: "Unknown Artist" }
 */
function songsManifestPlugin() {
  const songsDir = path.resolve(__dirname, 'public/songs');
  const manifestPath = path.resolve(songsDir, 'manifest.json');

  function generateManifest() {
    if (!fs.existsSync(songsDir)) {
      fs.mkdirSync(songsDir, { recursive: true });
    }

    const files = fs.readdirSync(songsDir)
      .filter(f => /\.(mp3|wav|ogg|m4a|flac|aac|webm)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const songs = files.map((file, i) => {
      const nameWithoutExt = file.replace(/\.[^.]+$/, '');
      let title, artist;

      if (nameWithoutExt.includes(' - ')) {
        const parts = nameWithoutExt.split(' - ');
        title = parts[0].trim();
        artist = parts.slice(1).join(' - ').trim();
      } else {
        title = nameWithoutExt.trim();
        artist = 'Unknown Artist';
      }

      return {
        title,
        artist,
        file: `/songs/${file}`,
        color: SONG_COLORS[i % SONG_COLORS.length],
      };
    });

    fs.writeFileSync(manifestPath, JSON.stringify(songs, null, 2));
    console.log(`🎵 Songs manifest: ${songs.length} track(s) found`);
    songs.forEach((s, i) => console.log(`   ${String(i + 1).padStart(2, '0')}. ${s.title} — ${s.artist}`));

    return songs;
  }

  return {
    name: 'songs-manifest',

    // Generate on dev server start
    configureServer(server) {
      generateManifest();

      // Watch for changes in songs folder
      server.watcher.add(songsDir);
      server.watcher.on('all', (event, filePath) => {
        if (filePath.startsWith(songsDir) && !filePath.endsWith('manifest.json')) {
          if (['add', 'unlink', 'change'].includes(event)) {
            console.log(`\n🔄 Songs folder changed (${event}), regenerating manifest...`);
            generateManifest();
            // Trigger HMR reload
            server.ws.send({ type: 'full-reload' });
          }
        }
      });
    },

    // Generate on build
    buildStart() {
      generateManifest();
    },
  };
}

export default defineConfig({
  plugins: [songsManifestPlugin()],
});
