import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AuthProvider } from '../context/AuthContext';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  }
}));

const mockUser = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com'
};

describe('Dashboard and Files', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock /api/me to return an authenticated user
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/me') {
        return Promise.resolve({ data: { status: 'success', data: { user: mockUser } } });
      }
      if (url === '/files') {
        return Promise.resolve({ data: { status: 'success', data: { files: [] } } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  const renderDashboard = () => {
    return render(
      <AuthProvider>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </AuthProvider>
    );
  };

  it('renders user details', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('handles empty file list', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText("You haven't uploaded any files yet.")).toBeInTheDocument();
    });
  });

  it('renders a list of files when available', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/me') return Promise.resolve({ data: { status: 'success', data: { user: mockUser } } });
      if (url === '/files') {
        return Promise.resolve({
          data: {
            status: 'success',
            data: {
              files: [
                { id: '1', original_name: 'test.pdf', mime_type: 'application/pdf', size_bytes: 1024, created_at: new Date().toISOString() }
              ]
            }
          }
        });
      }
    });

    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('1.0 KB')).toBeInTheDocument();
    });
  });
});
