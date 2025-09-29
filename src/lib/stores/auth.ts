import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface User {
	username: string;
	isAdmin: boolean;
}

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
		login: (username: string, password: string) => {
			// Check if this is the first user (admin setup)
			const users = getStoredUsers();
			
			if (users.length === 0) {
				// First user becomes admin
				const adminUser = { username, password, isAdmin: true };
				saveUser(adminUser);
				
				const user = { username, isAdmin: true };
				set({ user, isAuthenticated: true });
				
				if (browser) {
					localStorage.setItem('currentUser', JSON.stringify(user));
				}
				return { success: true, message: 'Admin account created successfully!' };
			}
			
			// Validate existing user
			const user = users.find(u => u.username === username && u.password === password);
			if (user) {
				const authUser = { username: user.username, isAdmin: user.isAdmin };
				set({ user: authUser, isAuthenticated: true });
				
				if (browser) {
					localStorage.setItem('currentUser', JSON.stringify(authUser));
				}
				return { success: true, message: 'Login successful!' };
			}
			
			return { success: false, message: 'Invalid credentials' };
		},
		hasExistingAccounts: () => {
			if (!browser) return false;
			const users = getStoredUsers();
			return users.length > 0;
		},
		logout: () => {
			set(initialState);
			if (browser) {
				localStorage.removeItem('currentUser');
			}
		},
		checkAuth: () => {
			if (browser) {
				const storedUser = localStorage.getItem('currentUser');
				if (storedUser) {
					const user = JSON.parse(storedUser);
					set({ user, isAuthenticated: true });
				}
			}
		}
	};
}

function getStoredUsers() {
	if (!browser) return [];
	const users = localStorage.getItem('users');
	return users ? JSON.parse(users) : [];
}

function saveUser(user: { username: string; password: string; isAdmin: boolean }) {
	if (!browser) return;
	const users = getStoredUsers();
	users.push(user);
	localStorage.setItem('users', JSON.stringify(users));
}

export const auth = createAuthStore();
