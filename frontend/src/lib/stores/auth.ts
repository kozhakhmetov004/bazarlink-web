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
				// Failed to parse stored user
			}
		}
		
		if (storedSupplier) {
			try {
				initialState.supplier = JSON.parse(storedSupplier);
			} catch (e) {
				// Failed to parse stored supplier
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
							// Failed to fetch supplier
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
						// Failed to fetch supplier
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
				// Failed to refresh auth state
			}
		},
		login: async (email: string, password: string): Promise<boolean> => {
			try {
				await authApi.login({ username: email, password });
				const userResponse = await authApi.getCurrentUser();
				const user = mapUser(userResponse);
				let supplier: Supplier | null = null;
				
				if (userResponse.supplier_id) {
					try {
						const supplierResponse = await suppliersApi.getSupplier(userResponse.supplier_id);
						supplier = mapSupplier(supplierResponse);
						supplier.ownerId = user.id;
					} catch (e) {
						// Failed to fetch supplier
					}
				}
				
				set({ user, supplier });
				
				if (browser) {
					localStorage.setItem('currentUser', JSON.stringify(user));
					if (supplier) {
						localStorage.setItem('currentSupplier', JSON.stringify(supplier));
					}
				}
				
				return true;
			} catch (error: any) {
				// Re-throw error so component can show the message
				throw error;
			}
		},
		logout: () => {
			// Clear API token
			authApi.logout();
			
			// Clear state
			set({ user: null, supplier: null });
			
			// Clear localStorage
			if (browser) {
				localStorage.removeItem('currentUser');
				localStorage.removeItem('currentSupplier');
				localStorage.removeItem('auth_token');
			}
		},
		register: async (
			email: string,
			password: string,
			name: string,
			supplierName: string,
			phone?: string
		): Promise<boolean> => {
			try {
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
				
				// Login after registration
				await authApi.login({ username: email, password });
				
				const user = mapUser(userResponse);
				let supplier: Supplier | null = null;
				
				if (userResponse.supplier_id) {
					try {
						const supplierResponse = await suppliersApi.getSupplier(userResponse.supplier_id);
						supplier = mapSupplier(supplierResponse);
						supplier.ownerId = user.id;
					} catch (e) {
						// Failed to fetch supplier
					}
				}
				
				set({ user, supplier });
				
				if (browser) {
					localStorage.setItem('currentUser', JSON.stringify(user));
					if (supplier) {
						localStorage.setItem('currentSupplier', JSON.stringify(supplier));
					}
				}
				
				return true;
			} catch (error: any) {
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
						// Failed to update supplier
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

