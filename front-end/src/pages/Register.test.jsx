import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';
import httpClient from '../httpClient';

jest.mock('../httpClient', () => ({
    post: jest.fn(),
}));

function renderRegister() {
    return render(
        <MemoryRouter>
            <Register />
        </MemoryRouter>
    );
}

async function fillValidForm(user, overrides = {}) {
    const data = {
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        password: 'secret123',
        degree: 'Tertiary',
        acceptTerms: true,
        ...overrides,
    };

    if (data.firstName !== null) {
        await user.type(
            screen.getByPlaceholderText('First Name'),
            data.firstName
        );
    }
    if (data.lastName !== null) {
        await user.type(
            screen.getByPlaceholderText('Last Name'),
            data.lastName
        );
    }
    if (data.email !== null) {
        await user.type(screen.getByPlaceholderText('Email'), data.email);
    }
    if (data.password !== null) {
        await user.type(screen.getByPlaceholderText('Password'), data.password);
    }
    if (data.degree !== null) {
        await user.selectOptions(screen.getByRole('combobox'), data.degree);
    }
    if (data.acceptTerms) {
        await user.click(screen.getByRole('checkbox'));
    }

    return data;
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Register', () => {
    test('renders register form and Log In link', () => {
        renderRegister();

        expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('First Name')).toBeRequired();

        expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Last Name')).toBeRequired();

        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeRequired();

        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeRequired();

        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeRequired();

        expect(screen.getByRole('checkbox')).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).toBeRequired();

        expect(
            screen.getByRole('button', { name: /create an account/i })
        ).toBeInTheDocument();

        const loginLink = screen.getByRole('link', { name: /log in/i });
        expect(loginLink).toHaveAttribute('href', '/login');
    });

    test('does not call API if terms are NOT checked and displays error message', async () => {
        const user = userEvent.setup();
        renderRegister();

        await fillValidForm(user, { acceptTerms: false });

        await user.click(
            screen.getByRole('button', { name: /create an account/i })
        );

        expect(httpClient.post).not.toHaveBeenCalled();
        expect(screen.getByText('You must agree to the Terms and conditions')).toBeInTheDocument();
    });

    test('does not call API if a required field is missing (example: degree) and displays error message', async () => {
        const user = userEvent.setup();
        renderRegister();

        await fillValidForm(user, { degree: null });
        await user.click(
            screen.getByRole('button', { name: /create an account/i })
        );

        expect(httpClient.post).not.toHaveBeenCalled();
        expect(screen.getByText('Current Degree is required')).toBeInTheDocument();
    });

    test('displays all error messages when form is submitted empty', async () => {
        const user = userEvent.setup();
        renderRegister();

        await user.click(
            screen.getByRole('button', { name: /create an account/i })
        );

        expect(httpClient.post).not.toHaveBeenCalled();
        expect(screen.getByText('First Name is required')).toBeInTheDocument();
        expect(screen.getByText('Last Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
        expect(screen.getByText('Current Degree is required')).toBeInTheDocument();
        expect(screen.getByText('You must agree to the Terms and conditions')).toBeInTheDocument();
    });


    test('successful signup calls API and redirects to /', async () => {
        const user = userEvent.setup();
        httpClient.post.mockResolvedValueOnce({ data: {} });

        const originalLocation = window.location;
        delete window.location;
        window.location = { href: '', pathname: '' };

        renderRegister();

        const data = await fillValidForm(user, {
            email: 'alice@example.com',
            degree: 'Tertiary',
            acceptTerms: true,
        });

        await user.click(
            screen.getByRole('button', { name: /create an account/i })
        );

        await waitFor(() => expect(httpClient.post).toHaveBeenCalledTimes(1));

        expect(httpClient.post).toHaveBeenCalledWith(
            '//localhost:5000/register',
            {
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                degree: data.degree,
            }
        );

        await waitFor(() => {
            expect(window.location.pathname).toBe('/');
        });

        window.location = originalLocation;
    });

    test('409 conflict shows alert with backend error message', async () => {
        const user = userEvent.setup();
        const alertSpy = jest
            .spyOn(window, 'alert')
            .mockImplementation(() => {});

        httpClient.post.mockRejectedValueOnce({
            response: { status: 409, data: { error: 'Email already exists' } },
        });

        renderRegister();
        await fillValidForm(user, { email: 'taken@example.com' });

        await user.click(
            screen.getByRole('button', { name: /create an account/i })
        );

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Email already exists');
        });

        alertSpy.mockRestore();
    });
});
