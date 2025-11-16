import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { User, Supplier } from '../types';
import { authApi, suppliersApi } from '../api';
import { mapUser, mapSupplier } from '../utils/mappers';

interface AuthState {
	user: User | null;
	supplier: Supplier | null;
}

function createAuthStore() {
	// Load from localStorage first for immediate display
	let initialState: AuthState = {
		user: null,
		supplier: null
	};

	if (browser) {
		const storedUser = localStorage.getItem('currentUser');
		const storedSupplier = localStorage.getItem('currentSupplier');
		
		if (storedUser) {
			try {
				initialState.user = JSON.parse(storedUser);
			} catch (e) {
				console.error('Failed to parse stored user:', e);
			}
		}
		
		if (storedSupplier) {
			try {
				initialState.supplier = JSON.parse(storedSupplier);
			} catch (e) {
				console.error('Failed to parse stored supplier:', e);
			}
		}
	}

	const { subscribe, set, update } = writable<AuthState>(initialState);

	// Refresh from API after loading from localStorage
	if (browser) {
		const token = localStorage.getItem('auth_token');
		if (token) {
			// Try to fetch current user
			authApi.getCurrentUser()
				.then(async (userResponse) => {
					const user = mapUser(userResponse);
					let supplier: Supplier | null = null;
					
					if (userResponse.supplier_id) {
						try {
							const supplierResponse = await suppliersApi.getSupplier(userResponse.supplier_id);
							supplier = mapSupplier(supplierResponse);
							supplier.ownerId = user.id;
						} catch (e) {
							console.error('Failed to fetch supplier', e);
						}
					}
					
					set({ user, supplier });
					
					localStorage.setItem('currentUser', JSON.stringify(user));
					if (supplier) {
						localStorage.setItem('currentSupplier', JSON.stringify(supplier));
					} else {
						localStorage.removeItem('currentSupplier');
					}
				})
				.catch(() => {
					// Token invalid, clear it
					localStorage.removeItem('auth_token');
					localStorage.removeItem('currentUser');
					localStorage.removeItem('currentSupplier');
					set({ user: null, supplier: null });
				});
		}
	}

	return {
		subscribe,
		refresh: async () => {
			// Refresh user and supplier data from API
			try {
				const userResponse = await authApi.getCurrentUser();
				const user = mapUser(userResponse);
				let supplier: Supplier | null = null;
				
				if (userResponse.supplier_id) {
					try {
						const supplierResponse = await suppliersApi.getSupplier(userResponse.supplier_id);
						supplier = mapSupplier(supplierResponse);
						supplier.ownerId = user.id;
					} catch (e) {
						console.error('Failed to fetch supplier', e);
					}
				}
				
				set({ user, supplier });
				
				if (browser) {
					localStorage.setItem('currentUser', JSON.stringify(user));
					if (supplier) {
						localStorage.setItem('currentSupplier', JSON.stringify(supplier));
					}
				}
			} catch (error) {
				console.error('Failed to refresh auth state:', error);
			}
		},
		login: async (email: string, password: string): Promise<boolean> => {
			try {
				console.log('Attempting login with:', email);
				await authApi.login({ username: email, password });
				console.log('Login successful, fetching user data...');
				const userResponse = await authApi.getCurrentUser();
				const user = mapUser(userResponse);
				let supplier: Supplier | null = null;
				
				if (userResponse.supplier_id) {
					try {
						const supplierResponse = await suppliersApi.getSupplier(userResponse.supplier_id);
						supplier = mapSupplier(supplierResponse);
						supplier.ownerId = user.id;
					} catch (e) {
						console.error('Failed to fetch supplier', e);
					}
				}
				
				set({ user, supplier });
				
				if (browser) {
					localStorage.setItem('currentUser', JSON.stringify(user));
					if (supplier) {
						localStorage.setItem('currentSupplier', JSON.stringify(supplier));
					}
				}
				
				console.log('Login complete, user set:', user);
				return true;
			} catch (error: any) {
				// Only log unexpected errors, not expected authentication failures
				const errorMessage = error?.message || 'Login failed';
				if (!errorMessage.includes('Incorrect') && !errorMessage.includes('Invalid')) {
					console.error('Unexpected login error:', error);
				} else {
					console.log('Login failed: Invalid credentials');
				}
				// Re-throw error so component can show the message
				throw error;
			}
		},
		logout: () => {
			console.log('=== LOGOUT PROCESS STARTED ===');
			
			// Get current state before clearing
			let currentUserEmail = 'Unknown';
			let currentUserRole = 'Unknown';
			const unsubscribe = subscribe((state) => {
				currentUserEmail = state.user?.email || 'No user';
				currentUserRole = state.user?.role || 'No role';
			});
			unsubscribe();
			
			console.log('Current user before logout:', {
				email: currentUserEmail,
				role: currentUserRole
			});
			
			// Clear API token
			console.log('Step 1: Clearing authentication token from API client...');
			authApi.logout();
			
			// Clear state
			console.log('Step 2: Clearing user and supplier state from store...');
			set({ user: null, supplier: null });
			
			// Clear localStorage
			if (browser) {
				console.log('Step 3: Clearing localStorage items...');
				const hadUser = localStorage.getItem('currentUser');
				const hadSupplier = localStorage.getItem('currentSupplier');
				const hadToken = localStorage.getItem('auth_token');
				
				console.log('localStorage before clear:', {
					hasUser: !!hadUser,
					hasSupplier: !!hadSupplier,
					hasToken: !!hadToken
				});
				
				localStorage.removeItem('currentUser');
				localStorage.removeItem('currentSupplier');
				localStorage.removeItem('auth_token');
				
				console.log('localStorage after clear:', {
					hasUser: !!(localStorage.getItem('currentUser')),
					hasSupplier: !!(localStorage.getItem('currentSupplier')),
					hasToken: !!(localStorage.getItem('auth_token'))
				});
			}
			
			console.log('=== LOGOUT PROCESS COMPLETE ===');
			console.log('User logged out:', currentUserEmail);
		},
		register: async (
			email: string,
			password: string,
			name: string,
			supplierName: string,
			phone?: string
		): Promise<boolean> => {
			try {
				console.log('=== OWNER REGISTRATION STARTED ===');
				console.log('Registration data:', {
					email,
					name,
					supplierName
				});
				
				console.log('Step 1: Calling registration API...');
				const userResponse = await authApi.registerOwner({
					email,
					password,
					full_name: name,
					phone: phone || undefined,
					supplier: {
						company_name: supplierName,
						email: email, // Use same email for supplier
					}
				});
				
				console.log('Step 2: Registration successful!', {
					userId: userResponse.id,
					email: userResponse.email,
					supplierId: userResponse.supplier_id
				});
				
				console.log('Step 3: Auto-logging in after registration...');
				// Login after registration
				await authApi.login({ username: email, password });
				console.log('Step 4: Login successful after registration');
				
				console.log('Step 5: Fetching user and supplier data...');
				const user = mapUser(userResponse);
				let supplier: Supplier | null = null;
				
				if (userResponse.supplier_id) {
					try {
						console.log('Fetching supplier data for supplier_id:', userResponse.supplier_id);
						const supplierResponse = await suppliersApi.getSupplier(userResponse.supplier_id);
						supplier = mapSupplier(supplierResponse);
						supplier.ownerId = user.id;
						console.log('Supplier data fetched:', supplier.name);
					} catch (e) {
						console.error('Failed to fetch supplier', e);
					}
				}
				
				console.log('Step 6: Setting user and supplier in store...');
				set({ user, supplier });
				
				if (browser) {
					console.log('Step 7: Saving to localStorage...');
					localStorage.setItem('currentUser', JSON.stringify(user));
					if (supplier) {
						localStorage.setItem('currentSupplier', JSON.stringify(supplier));
					}
					console.log('localStorage saved');
				}
				
				console.log('=== OWNER REGISTRATION COMPLETE ===');
				console.log('User registered and logged in:', {
					userId: user.id,
					email: user.email,
					role: user.role,
					supplierId: supplier?.id
				});
				return true;
			} catch (error: any) {
				const errorMessage = error?.message || 'Registration failed';
				
				// Only log unexpected errors
				if (!errorMessage.includes('already exists') && 
				    !errorMessage.includes('Missing required')) {
					console.error('Unexpected registration error:', error);
				} else {
					console.log('Registration failed:', errorMessage);
				}
				
				// Re-throw error so component can show the message
				throw error;
			}
		},
		updateSupplier: async (updates: Partial<Supplier>) => {
			update(async (state) => {
				if (state.supplier && state.user) {
					try {
						const supplierId = parseInt(state.supplier.id);
						const supplierResponse = await suppliersApi.updateSupplier(supplierId, {
							company_name: updates.name,
							description: updates.description,
							phone: updates.contactPhone,
							address: updates.address,
						});
						
						const updatedSupplier = mapSupplier(supplierResponse);
						updatedSupplier.ownerId = state.user.id;
						
						if (browser) {
							localStorage.setItem('currentSupplier', JSON.stringify(updatedSupplier));
						}
						
						return { ...state, supplier: updatedSupplier };
					} catch (e) {
						console.error('Failed to update supplier', e);
						return state;
					}
				}
				return state;
			});
		}
	};
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const user = derived(authStore, $auth => $auth.user);
export const supplier = derived(authStore, $auth => $auth.supplier);

