import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminRole, AdminService, AdminUserRow } from '../../services/admin.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { AdminNavComponent } from './admin-nav.component';

type UserFormState = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number: string;
  role: AdminRole;
  specialty: string;
  is_active: boolean;
  is_approved: boolean;
};

type UserListQuery = {
  search: string;
  role: '' | AdminRole;
  is_active: '' | 'true' | 'false';
  page: number;
  pageSize: number;
};

type PrefetchEntry = {
  query: UserListQuery;
  response: { results: AdminUserRow[]; count: number; next: string | null };
  cachedAt: number;
};

@Component({
  standalone: true,
  imports: [PageHeaderComponent, FormsModule, AdminNavComponent],
  template: `
    <app-page-header title="User Management" subtitle="Manage roles and active states." />
    <app-admin-nav />

    <div class="mb-4 grid gap-3 rounded-2xl bg-white p-4 shadow-soft md:grid-cols-5">
      <input
        class="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="Search by name or email"
        [(ngModel)]="filters.search"
        (ngModelChange)="onFilterInputChanged()"
      />
      <select
        class="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        [(ngModel)]="filters.role"
        (ngModelChange)="onFilterInputChanged()"
      >
        <option value="">All roles</option>
        <option value="admin">Admin</option>
        <option value="doctor">Doctor</option>
        <option value="receptionist">Receptionist</option>
        <option value="patient">Patient</option>
      </select>
      <select
        class="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        [(ngModel)]="filters.is_active"
        (ngModelChange)="onFilterInputChanged()"
      >
        <option value="">All statuses</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
      <button class="btn-secondary" (click)="applyFilters()">Apply</button>
      <button class="btn-primary" (click)="openCreateModal()">Create User</button>
    </div>

    <div class="card-surface overflow-x-auto p-4">
      @if (loadError) {
        <p class="mb-3 text-sm text-rose-600">{{ loadError }}</p>
      }
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="text-slate-500">
            <th class="pb-2">Name</th>
            <th class="pb-2">Email</th>
            <th class="pb-2">Role</th>
            <th class="pb-2">Active</th>
            <th class="pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          @if (isLoading && users.length === 0) {
            @for (row of skeletonRows; track row) {
              <tr class="border-t border-slate-100">
                <td class="py-3">
                  <div class="h-4 w-36 animate-pulse rounded bg-slate-100"></div>
                </td>
                <td class="py-3">
                  <div class="h-4 w-44 animate-pulse rounded bg-slate-100"></div>
                </td>
                <td class="py-3">
                  <div class="h-4 w-20 animate-pulse rounded bg-slate-100"></div>
                </td>
                <td class="py-3">
                  <div class="h-4 w-12 animate-pulse rounded bg-slate-100"></div>
                </td>
                <td class="py-3">
                  <div class="h-8 w-32 animate-pulse rounded bg-slate-100"></div>
                </td>
              </tr>
            }
          } @else if (users.length === 0) {
            <tr class="border-t border-slate-100">
              <td class="py-3 text-slate-500" colspan="5">No users to display.</td>
            </tr>
          } @else {
            @for (user of users; track user.id) {
              <tr class="border-t border-slate-100">
                <td class="py-2">{{ displayName(user) }}</td>
                <td class="py-2">{{ user.email }}</td>
                <td class="py-2">{{ user.role }}</td>
                <td class="py-2">{{ user.is_active ? 'Yes' : 'No' }}</td>
                <td class="py-2">
                  <div class="flex gap-2">
                    <button class="btn-secondary" (click)="openEditModal(user)">Edit</button>
                    <button class="btn-secondary" (click)="deactivate(user)" [disabled]="!user.is_active">Deactivate</button>
                  </div>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
      <div class="mt-3 flex items-center justify-between text-sm">
        <p class="text-slate-500">Showing {{ users.length }} of {{ totalCount }} users</p>
        @if (showRefreshing) {
          <p class="text-xs text-slate-500">Refreshing...</p>
        }
        <div class="flex gap-2">
          <button class="btn-secondary" [disabled]="page <= 1" (click)="changePage(page - 1)">Previous</button>
          <button class="btn-secondary" [disabled]="!hasNextPage" (click)="changePage(page + 1)">Next</button>
        </div>
      </div>
    </div>

    @if (showModal) {
      <div class="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
        <div class="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
          <h3 class="mb-4 text-lg font-semibold">{{ editingUserId ? 'Edit User' : 'Create User' }}</h3>
          <div class="grid gap-3 md:grid-cols-2">
            <input class="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="First name" [(ngModel)]="form.first_name" />
            <input class="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Last name" [(ngModel)]="form.last_name" />
            <input class="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Email" [(ngModel)]="form.email" />
            @if (!editingUserId) {
              <input class="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Temporary password" [(ngModel)]="form.password" />
            }
            <select class="rounded-lg border border-slate-200 px-3 py-2 text-sm" [(ngModel)]="form.role">
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
              <option value="patient">Patient</option>
            </select>
            <select class="rounded-lg border border-slate-200 px-3 py-2 text-sm" [(ngModel)]="form.is_active">
              <option [ngValue]="true">Active</option>
              <option [ngValue]="false">Inactive</option>
            </select>
            <select class="rounded-lg border border-slate-200 px-3 py-2 text-sm" [(ngModel)]="form.is_approved">
              <option [ngValue]="true">Approved</option>
              <option [ngValue]="false">Pending approval</option>
            </select>
            <input class="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Phone number" [(ngModel)]="form.phone_number" />
            @if (form.role === 'doctor') {
              <input class="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Specialty" [(ngModel)]="form.specialty" />
            }
          </div>
          @if (modalError) {
            <p class="mt-3 text-sm text-rose-600">{{ modalError }}</p>
          }
          <div class="mt-4 flex justify-end gap-2">
            <button class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="saveUser()">Save</button>
          </div>
        </div>
      </div>
    }
  `
})
export class UserManagementPage {
  private static readonly USERS_CACHE_KEY = 'mf_admin_users_cache';
  private static readonly USERS_CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly adminService = inject(AdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected users: AdminUserRow[] = [];
  protected loadError: string | null = null;
  protected modalError: string | null = null;
  protected page = 1;
  protected readonly pageSize = 10;
  protected totalCount = 0;
  protected hasNextPage = false;
  protected isLoading = false;
  protected showRefreshing = false;
  protected readonly skeletonRows = Array.from({ length: 6 }, (_, idx) => idx);
  private requestVersion = 0;
  private prefetchRequestVersion = 0;
  private refreshIndicatorTimer: ReturnType<typeof setTimeout> | null = null;
  private prefetchTimer: ReturnType<typeof setTimeout> | null = null;
  private prefetchedEntries = new Map<string, PrefetchEntry>();
  protected showModal = false;
  protected editingUserId: number | null = null;
  protected filters: {
    search: string;
    role: '' | AdminRole;
    is_active: '' | 'true' | 'false';
  } = {
    search: '',
    role: '',
    is_active: ''
  };
  private appliedFilters: {
    search: string;
    role: '' | AdminRole;
    is_active: '' | 'true' | 'false';
  } = {
    search: '',
    role: '',
    is_active: ''
  };
  private activeQuery: UserListQuery = {
    search: '',
    role: '',
    is_active: '',
    page: 1,
    pageSize: this.pageSize,
  };
  protected form: UserFormState = this.emptyForm();

  constructor() {
    this.restoreCachedUsers();
    this.fetchUsers(this.activeQuery);
  }

  protected applyFilters(): void {
    const nextQuery: UserListQuery = {
      search: this.filters.search.trim(),
      role: this.filters.role,
      is_active: this.filters.is_active,
      page: 1,
      pageSize: this.pageSize,
    };
    if (this.isSameQuery(nextQuery, this.activeQuery)) return;

    this.page = 1;
    this.loadError = null;
    this.appliedFilters = {
      search: nextQuery.search,
      role: nextQuery.role,
      is_active: nextQuery.is_active,
    };
    this.activeQuery = { ...nextQuery };
    const key = this.filterKey(this.activeQuery);
    const prefetched = this.prefetchedEntries.get(key);
    if (prefetched) {
      this.loadError = null;
      this.users = prefetched.response.results;
      this.totalCount = prefetched.response.count;
      this.hasNextPage = Boolean(prefetched.response.next);
      this.page = prefetched.query.page;
      this.cdr.markForCheck();
    }
    this.fetchUsers(this.activeQuery);
  }

  protected changePage(nextPage: number): void {
    this.page = nextPage;
    this.activeQuery = { ...this.activeQuery, page: nextPage, pageSize: this.pageSize };
    this.fetchUsers(this.activeQuery);
  }

  protected openCreateModal(): void {
    this.editingUserId = null;
    this.form = this.emptyForm();
    this.modalError = null;
    this.showModal = true;
    this.cdr.markForCheck();
  }

  protected openEditModal(user: AdminUserRow): void {
    this.editingUserId = user.id;
    this.form = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: '',
      phone_number: user.phone_number ?? '',
      role: user.role ?? 'patient',
      specialty: user.specialty ?? '',
      is_active: user.is_active,
      is_approved: user.is_approved
    };
    this.modalError = null;
    this.showModal = true;
    this.cdr.markForCheck();
  }

  protected closeModal(): void {
    this.showModal = false;
    this.modalError = null;
    this.cdr.markForCheck();
  }

  protected saveUser(): void {
    const payload = { ...this.form };
    if (payload.role !== 'doctor') {
      payload.specialty = '';
    }

    const request$ = this.editingUserId
      ? this.adminService.updateUser(this.editingUserId, payload)
      : this.adminService.createUser(payload);

    request$.subscribe({
      next: () => {
        this.closeModal();
        this.fetchUsers(this.activeQuery);
      },
      error: (error: unknown) => {
        this.modalError = this.readErrorMessage(error, 'Unable to save user.');
        this.cdr.markForCheck();
      }
    });
  }

  protected deactivate(user: AdminUserRow): void {
    this.adminService.deactivateUser(user.id).subscribe({
      next: () => this.fetchUsers(this.activeQuery),
      error: (error: unknown) => {
        this.loadError = this.readErrorMessage(error, 'Unable to deactivate user.');
        this.cdr.markForCheck();
      }
    });
  }

  protected displayName(user: AdminUserRow): string {
    return `${user.first_name} ${user.last_name}`.trim() || '—';
  }

  protected onFilterInputChanged(): void {
    if (this.prefetchTimer) {
      clearTimeout(this.prefetchTimer);
      this.prefetchTimer = null;
    }
    this.prefetchTimer = setTimeout(() => {
      const query: UserListQuery = {
        search: this.filters.search.trim(),
        role: this.filters.role,
        is_active: this.filters.is_active,
        page: 1,
        pageSize: this.pageSize,
      };
      if (this.isQueryEmpty(query) || this.isSameQuery(query, this.activeQuery)) return;
      this.prefetchUsers(query);
    }, 250);
  }

  private fetchUsers(query: UserListQuery): void {
    const currentRequestVersion = ++this.requestVersion;
    this.isLoading = true;
    this.showRefreshing = false;
    if (this.refreshIndicatorTimer) {
      clearTimeout(this.refreshIndicatorTimer);
      this.refreshIndicatorTimer = null;
    }
    if (this.users.length > 0) {
      this.refreshIndicatorTimer = setTimeout(() => {
        if (this.isLoading) {
          this.showRefreshing = true;
          this.cdr.markForCheck();
        }
      }, 350);
    }
    this.cdr.markForCheck();

    this.adminService.users({
      search: query.search,
      role: query.role,
      is_active: query.is_active,
      page: String(query.page),
      page_size: String(query.pageSize)
    }).pipe(
      finalize(() => {
        if (currentRequestVersion === this.requestVersion) {
          this.isLoading = false;
          this.showRefreshing = false;
          if (this.refreshIndicatorTimer) {
            clearTimeout(this.refreshIndicatorTimer);
            this.refreshIndicatorTimer = null;
          }
          this.cdr.markForCheck();
        }
      })
    ).subscribe({
      next: (response) => {
        if (currentRequestVersion !== this.requestVersion) return;
        this.loadError = null;
        this.users = response.results;
        this.totalCount = response.count;
        this.hasNextPage = Boolean(response.next);
        this.page = query.page;
        localStorage.setItem(
          UserManagementPage.USERS_CACHE_KEY,
          JSON.stringify({
            users: response.results,
            totalCount: response.count,
            hasNextPage: Boolean(response.next),
            filterKey: this.filterKey(query),
            cachedAt: Date.now(),
            query,
          }),
        );
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        if (currentRequestVersion !== this.requestVersion) return;
        this.loadError = this.readErrorMessage(error, 'Unable to load users right now.');
        if (this.users.length === 0) {
          this.totalCount = 0;
          this.hasNextPage = false;
        }
        this.cdr.markForCheck();
      }
    });
  }

  private prefetchUsers(query: UserListQuery): void {
    const currentPrefetchVersion = ++this.prefetchRequestVersion;
    const key = this.filterKey(query);
    this.adminService.users({
      search: query.search,
      role: query.role,
      is_active: query.is_active,
      page: String(query.page),
      page_size: String(query.pageSize)
    }).subscribe({
      next: (response) => {
        if (currentPrefetchVersion !== this.prefetchRequestVersion) return;
        this.prefetchedEntries.set(key, {
          query,
          response,
          cachedAt: Date.now(),
        });
      },
      error: () => {}
    });
  }

  private restoreCachedUsers(): void {
    const raw = localStorage.getItem(UserManagementPage.USERS_CACHE_KEY);
    if (!raw) return;
    try {
      const cached = JSON.parse(raw) as {
        users: AdminUserRow[];
        totalCount: number;
        hasNextPage: boolean;
        filterKey?: string;
        cachedAt?: number;
        query?: UserListQuery;
      };
      if (cached.cachedAt && Date.now() - cached.cachedAt > UserManagementPage.USERS_CACHE_TTL_MS) {
        localStorage.removeItem(UserManagementPage.USERS_CACHE_KEY);
        return;
      }
      if (cached && Array.isArray(cached.users)) {
        if (cached.query) {
          this.activeQuery = cached.query;
          this.page = cached.query.page;
          this.filters.search = cached.query.search;
          this.filters.role = cached.query.role;
          this.filters.is_active = cached.query.is_active;
          this.appliedFilters = {
            search: cached.query.search,
            role: cached.query.role,
            is_active: cached.query.is_active,
          };
        }
        if (cached.filterKey && cached.filterKey !== this.filterKey(this.activeQuery)) return;
        this.users = cached.users;
        this.totalCount = cached.totalCount ?? cached.users.length;
        this.hasNextPage = Boolean(cached.hasNextPage);
      }
    } catch {
      localStorage.removeItem(UserManagementPage.USERS_CACHE_KEY);
    }
  }

  private emptyForm(): UserFormState {
    return {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      phone_number: '',
      role: 'patient',
      specialty: '',
      is_active: true,
      is_approved: true
    };
  }

  private readErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.detail === 'string') {
      return error.error.detail;
    }
    return fallback;
  }

  private filterKey(filters: UserListQuery): string {
    return JSON.stringify({
      search: filters.search.trim().toLowerCase(),
      role: filters.role,
      is_active: filters.is_active,
      page: filters.page,
      pageSize: filters.pageSize,
    });
  }

  private isSameQuery(a: UserListQuery, b: UserListQuery): boolean {
    return (
      a.search.trim().toLowerCase() === b.search.trim().toLowerCase() &&
      a.role === b.role &&
      a.is_active === b.is_active &&
      a.page === b.page &&
      a.pageSize === b.pageSize
    );
  }

  private isQueryEmpty(query: UserListQuery): boolean {
    return query.search.trim() === '' && query.role === '' && query.is_active === '';
  }
}
