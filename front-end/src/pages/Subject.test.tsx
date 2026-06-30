import { render, screen, waitFor } from '@testing-library/react';
import Subject from './Subject';
import httpClient from '../httpClient';
import { useLocation } from 'react-router-dom';

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return { ...actual, useLocation: jest.fn() };
});

jest.mock('../httpClient', () => ({
    __esModule: true,
    default: { get: jest.fn() },
}));

const mockedUseLocation = jest.mocked(useLocation);
const mockedGet = jest.mocked(httpClient.get);

beforeEach(() => {
    jest.clearAllMocks();
});

test('renders only matching subject with grade', async () => {
    mockedUseLocation.mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: 'Math',
        key: '',
    });

    mockedGet.mockResolvedValueOnce({
        data: {
            assignments: [
                {
                    subject: 'Math',
                    difficulty: 'easy',
                    assigned_date: '2026-02-01',
                    comment: 'Nice',
                    grade: 'A',
                },
                {
                    subject: 'Math',
                    difficulty: 'hard',
                    assigned_date: '2026-02-02',
                    comment: 'No grade',
                    grade: '',
                },
                {
                    subject: 'Physics',
                    difficulty: 'medium',
                    assigned_date: '2026-02-03',
                    comment: 'Other',
                    grade: 'B',
                },
            ],
        },
    });

    render(<Subject />);

    await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledWith('//localhost:5000/@assignment');
    });

    expect(await screen.findByText(/Difficulty:\s*EASY/i)).toBeInTheDocument();
    expect(screen.getByText(/Grade:\s*A/i)).toBeInTheDocument();

    expect(screen.queryByText(/No grade/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Other/i)).not.toBeInTheDocument();
});
