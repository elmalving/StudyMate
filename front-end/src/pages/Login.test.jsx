import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import httpClient from '../httpClient';

jest.mock('../httpClient', () => ({
    post: jest.fn(),
}));

function renderLogin() {
    return render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    );
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Login', () => {
    test('renders welcome text and inputs', () => {
        renderLogin();

        expect(screen.getByText(/Welcome to/i)).toBeInTheDocument();
        expect(screen.getByText(/StudyMate!/i)).toBeInTheDocument();

        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();

        expect(
            screen.getByRole('button', { name: /log in/i })
        ).toBeInTheDocument();
    });

    test('allows typing into email and password fields', async () => {
        const user = userEvent.setup();
        renderLogin();

        const emailInput = screen.getByPlaceholderText('Email');
        const passwordInput = screen.getByPlaceholderText('Password');

        await user.type(emailInput, 'me@example.com');
        await user.type(passwordInput, 'secret');

        expect(emailInput).toHaveValue('me@example.com');
        expect(passwordInput).toHaveValue('secret');
    });

    test('successful login calls API and redirects to /', async () => {
        const user = userEvent.setup();
        httpClient.post.mockResolvedValueOnce({ data: {} });

        const originalLocation = window.location;
        delete window.location;
        window.location = { href: '' };

        renderLogin();

        await user.type(screen.getByPlaceholderText('Email'), 'me@example.com');
        await user.type(screen.getByPlaceholderText('Password'), 'secret');

        await user.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(httpClient.post).toHaveBeenCalledTimes(1);
        });

        expect(httpClient.post).toHaveBeenCalledWith('//localhost:5000/login', {
            email: 'me@example.com',
            password: 'secret',
        });

        await waitFor(() => {
            expect(window.location.pathname).toBe('/');
        });

        window.location = originalLocation;
    });

    test("network/db down shows alert 'Database is down.'", async () => {
        const user = userEvent.setup();
        const alertSpy = jest
            .spyOn(window, 'alert')
            .mockImplementation(() => {});

        httpClient.post.mockRejectedValueOnce(new Error('Network error'));

        renderLogin();

        await user.type(screen.getByPlaceholderText('Email'), 'me@example.com');
        await user.type(screen.getByPlaceholderText('Password'), 'secret');
        await user.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Database is down.');
        });

        alertSpy.mockRestore();
    });

    test("401 shows alert 'Invalid credentials.'", async () => {
        const user = userEvent.setup();
        const alertSpy = jest
            .spyOn(window, 'alert')
            .mockImplementation(() => {});

        httpClient.post.mockRejectedValueOnce({
            response: { status: 401 },
        });

        renderLogin();

        await user.type(screen.getByPlaceholderText('Email'), 'me@example.com');
        await user.type(screen.getByPlaceholderText('Password'), 'wrong');
        await user.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Invalid credentials.');
        });

        alertSpy.mockRestore();
    });

    test('sign up link points to /register', () => {
        renderLogin();

        const signUpLink = screen.getByRole('link', { name: /sign up/i });
        expect(signUpLink).toHaveAttribute('href', '/register');
    });
});
