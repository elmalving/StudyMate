import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Schedule from './Schedule';
import httpClient from '../httpClient.jsx';
import { Assignment, User } from '../types.js';

jest.mock('../httpClient.jsx', () => ({
    get: jest.fn(),
}));

const mockedGet = jest.mocked(httpClient.get);

beforeEach(() => {
    jest.clearAllMocks();
});

function mockGetImplementation({
    meEmail,
    allEmails,
    assignmentsByEmail,
}: {
    meEmail: User['email'];
    allEmails: User['email'][];
    assignmentsByEmail: Record<User['email'], Assignment[]>;
}) {
    mockedGet.mockImplementation((url, config) => {
        if (url === '//localhost:5000/@me') {
            return Promise.resolve({ data: { email: meEmail } });
        }

        if (url === '//localhost:5000/@all_email') {
            return Promise.resolve({
                data: allEmails.map((e) => ({ email: e })),
            });
        }

        if (url === '//localhost:5000/@assignment') {
            const email = config?.params?.email;
            return Promise.resolve({
                data: { assignments: assignmentsByEmail[email] ?? [] },
            });
        }

        return Promise.reject(new Error(`Unhandled url: ${url}`));
    });
}

describe('Schedule', () => {
    test('admin: shows email select, loads all emails and loads assignments for selected email', async () => {
        mockGetImplementation({
            meEmail: 'test@gmail.com',
            allEmails: ['a@a.com', 'b@b.com'],
            assignmentsByEmail: {
                'test@gmail.com': [],
            },
        });

        render(<Schedule />);

        const combo = await screen.findByRole('combobox');
        expect(combo).toBeInTheDocument();

        await waitFor(() => {
            expect(
                screen.getByRole('option', { name: 'a@a.com' })
            ).toBeInTheDocument();
            expect(
                screen.getByRole('option', { name: 'b@b.com' })
            ).toBeInTheDocument();
        });

        expect(httpClient.get).toHaveBeenCalledWith('//localhost:5000/@me');
        expect(httpClient.get).toHaveBeenCalledWith(
            '//localhost:5000/@assignment',
            {
                params: { email: 'test@gmail.com' },
            }
        );
        expect(httpClient.get).toHaveBeenCalledWith(
            '//localhost:5000/@all_email',
            {
                params: { email: 'test@gmail.com' },
            }
        );
    });

    test('renders assignment subject into the correct rect', async () => {
        mockGetImplementation({
            meEmail: 'test@gmail.com',
            allEmails: [],
            assignmentsByEmail: {
                'test@gmail.com': [
                    {
                        rect: 0,
                        subject: 'Math',
                        difficulty: 'easy',
                        answer: '',
                        id: '',
                        text: '',
                        url: '',
                        assigned_date: '',
                        comment: '',
                        grade: 0,
                    },
                ],
            },
        });

        render(<Schedule />);

        expect(await screen.findByText('Math')).toBeInTheDocument();

        const rect0 = screen.getByTestId('schedule-rect-0');

        expect(rect0.textContent).toContain('Math');
    });

    test('admin can click an empty rect and popup appears', async () => {
        const user = userEvent.setup();

        mockGetImplementation({
            meEmail: 'test@gmail.com',
            allEmails: [],
            assignmentsByEmail: {
                'test@gmail.com': [],
            },
        });

        render(<Schedule />);

        const rect0 = screen.getByTestId('schedule-rect-0');

        await user.click(rect0);

        expect(await screen.findByLabelText('Subject')).toBeInTheDocument();
        expect(screen.getByLabelText('Difficulty')).toBeInTheDocument();
        expect(screen.getByLabelText('Task')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /create task/i })
        ).toBeInTheDocument();
    });

    test('non-admin cannot click an empty rect (no popup)', async () => {
        const user = userEvent.setup();

        mockGetImplementation({
            meEmail: 'student@example.com',
            allEmails: [],
            assignmentsByEmail: {
                'test@gmail.com': [],
            },
        });

        render(<Schedule />);

        const rect0 = screen.getByTestId('schedule-rect-0');

        await user.click(rect0);

        expect(
            screen.queryByTestId('assignment-popup')
        ).not.toBeInTheDocument();
    });

    test('non-admin CAN click a rect only if there is an assignment at that rect', async () => {
        const user = userEvent.setup();

        mockGetImplementation({
            meEmail: 'student@example.com',
            allEmails: [],
            assignmentsByEmail: {
                'test@gmail.com': [
                    {
                        rect: 0,
                        subject: 'Math',
                        difficulty: 'easy',
                        answer: '',
                        id: '',
                        text: '',
                        url: '',
                        assigned_date: '',
                        comment: '',
                        grade: 0,
                    },
                ],
            },
        });

        render(<Schedule />);

        expect(await screen.findByText('Math')).toBeInTheDocument();

        const rect0 = screen.getByTestId('schedule-rect-0');

        await user.click(rect0);

        expect(
            await screen.findByTestId('assignment-popup')
        ).toBeInTheDocument();
    });

    test('closes popup when Escape key is pressed', async () => {
        const user = userEvent.setup();

        mockGetImplementation({
            meEmail: 'test@gmail.com',
            allEmails: [],
            assignmentsByEmail: {
                'test@gmail.com': [],
            },
        });

        render(<Schedule />);

        const rect0 = screen.getByTestId('schedule-rect-0');
        await user.click(rect0);

        expect(await screen.findByLabelText('Subject')).toBeInTheDocument();

        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByLabelText('Subject')).not.toBeInTheDocument();
        });
    });

    test('closes popup when clicking outside the popup', async () => {
        const user = userEvent.setup();

        mockGetImplementation({
            meEmail: 'test@gmail.com',
            allEmails: [],
            assignmentsByEmail: {
                'test@gmail.com': [],
            },
        });

        render(<Schedule />);

        const rect0 = screen.getByTestId('schedule-rect-0');
        await user.click(rect0);

        expect(await screen.findByLabelText('Subject')).toBeInTheDocument();

        await user.click(document.body);

        await waitFor(() => {
            expect(screen.queryByLabelText('Subject')).not.toBeInTheDocument();
        });
    });
});
