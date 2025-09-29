import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, unlink, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const PUT: RequestHandler = async ({ request, url }) => {
	try {
		const filename = url.searchParams.get('filename');
		if (!filename) {
			return json({ error: 'Filename required' }, { status: 400 });
		}

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const thumbnail = formData.get('thumbnail') as File | null;

		if (!title) {
			return json({ error: 'Title is required' }, { status: 400 });
		}

		// Validate thumbnail if provided
		if (thumbnail) {
			const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
			if (!validImageTypes.includes(thumbnail.type)) {
				return json({ error: 'Invalid thumbnail type. Please upload JPEG, PNG, or WebP images.' }, { status: 400 });
			}
		}

		// Find the video file
		const videosDir = path.join(process.cwd(), 'static', 'videos');
		const imagesDir = path.join(process.cwd(), 'static', 'images');
		
		if (!existsSync(videosDir)) {
			return json({ error: 'Video not found' }, { status: 404 });
		}

		const files = await readdir(videosDir);
		const videoFile = files.find(f => f === filename);
		
		if (!videoFile) {
			return json({ error: 'Video not found' }, { status: 404 });
		}

		// Get current video info
		const videoPath = path.join(videosDir, filename);
		const fs = await import('fs');
		const stats = await fs.promises.stat(videoPath);
		
		// Update thumbnail if provided
		let thumbnailUrl = undefined;
		if (thumbnail) {
			// Remove old thumbnail if exists
			const imageFiles = await readdir(imagesDir);
			const oldThumbnail = imageFiles.find(f => f.startsWith(filename.replace(/\.[^/.]+$/, '_thumb')));
			
			if (oldThumbnail) {
				await unlink(path.join(imagesDir, oldThumbnail));
			}

			// Save new thumbnail
			const thumbnailExtension = path.extname(thumbnail.name);
			const thumbnailFilename = filename.replace(/\.[^/.]+$/, '_thumb') + thumbnailExtension;
			const thumbnailFilepath = path.join(imagesDir, thumbnailFilename);
			
			const thumbnailBuffer = Buffer.from(await thumbnail.arrayBuffer());
			await writeFile(thumbnailFilepath, thumbnailBuffer);
			
			thumbnailUrl = `/images/${thumbnailFilename}`;
		} else {
			// Keep existing thumbnail if no new one provided
			const imageFiles = await readdir(imagesDir);
			const existingThumbnail = imageFiles.find(f => f.startsWith(filename.replace(/\.[^/.]+$/, '_thumb')));
			if (existingThumbnail) {
				thumbnailUrl = `/images/${existingThumbnail}`;
			}
		}

		// Save the updated video metadata to a JSON file
		const metadataFile = path.join(videosDir, filename.replace(/\.[^/.]+$/, '.json'));
		const metadata = {
			title,
			thumbnail: thumbnailUrl || undefined,
			updatedAt: new Date().toISOString()
		};
		await writeFile(metadataFile, JSON.stringify(metadata, null, 2));

		// Return updated video info
		const videoInfo = {
			id: filename, // Use filename as ID for consistency
			title,
			filename,
			url: `/videos/${filename}`,
			thumbnail: thumbnailUrl || undefined,
			uploadedAt: stats.birthtime.toISOString(),
			size: stats.size
		};

		return json({ success: true, video: videoInfo });

	} catch (error) {
		console.error('Update error:', error);
		return json({ error: 'Failed to update video' }, { status: 500 });
	}
};

