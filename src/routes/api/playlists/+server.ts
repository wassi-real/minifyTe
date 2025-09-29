import { json } from '@sveltejs/kit';
import { writeFile, readFile, readdir, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { RequestHandler } from './$types';

const playlistsDir = path.join(process.cwd(), 'static', 'playlists');

// Ensure playlists directory exists
async function ensurePlaylistsDir() {
	if (!existsSync(playlistsDir)) {
		await import('fs').then(fs => fs.promises.mkdir(playlistsDir, { recursive: true }));
	}
}

// GET - List all playlists
export const GET: RequestHandler = async () => {
	try {
		await ensurePlaylistsDir();
		
		const files = await readdir(playlistsDir);
		const playlistFiles = files.filter(file => file.endsWith('.json') && file !== '.gitkeep');
		
		const playlists = await Promise.all(
			playlistFiles.map(async (filename) => {
				const filepath = path.join(playlistsDir, filename);
				const content = await readFile(filepath, 'utf8');
				return JSON.parse(content);
			})
		);

		// Sort by creation date (newest first)
		playlists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		return json({ playlists });
	} catch (error) {
		console.error('Failed to load playlists:', error);
		return json({ error: 'Failed to load playlists' }, { status: 500 });
	}
};

// POST - Create new playlist
export const POST: RequestHandler = async ({ request }) => {
	try {
		await ensurePlaylistsDir();
		
		const { name, description } = await request.json();
		
		if (!name?.trim()) {
			return json({ error: 'Playlist name is required' }, { status: 400 });
		}

		const playlistId = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const now = new Date().toISOString();
		
		const playlist = {
			id: playlistId,
			name: name.trim(),
			description: description?.trim() || '',
			videoIds: [],
			createdAt: now,
			updatedAt: now
		};

		const playlistFile = path.join(playlistsDir, `${playlistId}.json`);
		await writeFile(playlistFile, JSON.stringify(playlist, null, 2));

		return json({ success: true, playlist });
	} catch (error) {
		console.error('Failed to create playlist:', error);
		return json({ error: 'Failed to create playlist' }, { status: 500 });
	}
};

// DELETE - Delete playlist
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		await ensurePlaylistsDir();
		
		const { playlistId } = await request.json();
		
		if (!playlistId) {
			return json({ error: 'Playlist ID is required' }, { status: 400 });
		}

		const playlistFile = path.join(playlistsDir, `${playlistId}.json`);
		
		if (!existsSync(playlistFile)) {
			return json({ error: 'Playlist not found' }, { status: 404 });
		}

		await unlink(playlistFile);

		return json({ success: true });
	} catch (error) {
		console.error('Failed to delete playlist:', error);
		return json({ error: 'Failed to delete playlist' }, { status: 500 });
	}
};
