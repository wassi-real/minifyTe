import { json } from '@sveltejs/kit';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { RequestHandler } from './$types';

// DELETE - Delete user account
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { username, password } = await request.json();
		
		if (!username || !password) {
			return json({ error: 'Username and password are required' }, { status: 400 });
		}

		// Verify password by checking if login would work
		const usersFile = path.join(process.cwd(), 'static', 'users.json');
		
		if (!existsSync(usersFile)) {
			return json({ error: 'No users found' }, { status: 404 });
		}

		const usersContent = await import('fs').then(fs => fs.promises.readFile(usersFile, 'utf8'));
		const users = JSON.parse(usersContent);

		// Find user and verify password
		const user = users.find((u: any) => u.username === username);
		if (!user || user.password !== password) {
			return json({ error: 'Invalid credentials' }, { status: 401 });
		}

		// Delete the users file (this will effectively delete the account)
		await unlink(usersFile);

		return json({ success: true, message: 'Account deleted successfully' });
	} catch (error) {
		console.error('Failed to delete account:', error);
		return json({ error: 'Failed to delete account' }, { status: 500 });
	}
};
