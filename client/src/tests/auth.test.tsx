import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import { AuthProvider } from '../context/AuthContext';
import { api } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  }
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('Authentication Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({ data: { status: 'error' } }); // Mock initial /api/me as unauthenticated
  });

  describe('Login Form Validation', () => {
    it('shows error when fields are empty', async () => {
      renderWithRouter(<Login />);
      
      const form = screen.getByRole('button', { name: /log in/i }).closest('form')!;
      fireEvent.submit(form);
      
      expect(await screen.findByText('Please fill in all fields')).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('submits correctly when fields are filled', async () => {
      (api.post as any).mockResolvedValueOnce({ data: { status: 'success' } });
      renderWithRouter(<Login />);
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });
  });

  describe('Registration Form Validation', () => {
    it('validates password strength', async () => {
      renderWithRouter(<Register />);
      
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'weak' } }); // weak password
      
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
      
      expect(await screen.findByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });
  });
});
