import { render, screen, waitFor } from '@testing-library/react';
import Progress from './Progress';
import httpClient from '../httpClient.jsx';

jest.mock('../httpClient.jsx', () => ({
    __esModule: true,
    default: { get: jest.fn() },
}));

jest.mock('../components/GradeBySubjectChart', () => ({
    __esModule: true,
    default: () => <div>Grade Chart</div>,
}));

jest.mock('../components/PerformanceTrendChart', () => ({
    __esModule: true,
    default: () => <div>Trend Chart</div>,
}));

jest.mock('../components/DifficultyChart', () => ({
    __esModule: true,
    default: () => <div>Difficulty Chart</div>,
}));

jest.mock('../components/CompletionRateChart', () => ({
    __esModule: true,
    default: () => <div>Completion Chart</div>,
}));

beforeEach(() => {
    jest.clearAllMocks();
});

test('fetches chart data and renders dashboard headings', async () => {
    const mockedGet = httpClient.get;

    mockedGet
        .mockResolvedValueOnce({
            data: { data: [{ subject: 'Math', grade: 'A' }] },
        })
        .mockResolvedValueOnce({
            data: { data: [{ date: '2026-01-01', score: 90 }] },
        })
        .mockResolvedValueOnce({ data: { data: { easy: 2, hard: 1 } } })
        .mockResolvedValueOnce({
            data: { data: [{ subject: 'Math', completion: 0.8 }] },
        });

    render(<Progress />);

    expect(screen.getByText(/Loading charts/i)).toBeInTheDocument();

    await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledTimes(4);
    });

    expect(await screen.findByText(/Performance Dashboard/i)).toBeInTheDocument();
    expect(
        await screen.findByText(/Grade Distribution by Subject/i)
    ).toBeInTheDocument();
    expect(
        await screen.findByText(/Performance Trend Over Time/i)
    ).toBeInTheDocument();
    expect(
        await screen.findByText(/Assignment Difficulty Breakdown/i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/Subject Completion Rate/i)).toBeInTheDocument();
});

test('shows error message when fetch fails', async () => {
    const mockedGet = httpClient.get;
    mockedGet.mockRejectedValueOnce(new Error('Network error'));

    render(<Progress />);

    await waitFor(() => {
        expect(
            screen.getByText(/Failed to load chart data/i)
        ).toBeInTheDocument();
    });
});
