import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chat from './Chat';
import httpClient from '../httpClient';

jest.mock('../httpClient', () => ({
    post: jest.fn(),
}));

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    const mockReact = require('react');
    return {
        ...actual,
        useOutletContext: () => {
            const [messages, setMessages] = mockReact.useState([]);
            const [isVisible, setIsVisible] = mockReact.useState(true);
            return {
                chatMessages: messages,
                setChatMessages: setMessages,
                chatVisible: isVisible,
                setChatVisible: setIsVisible,
            };
        }
    };
});

beforeEach(() => {
    jest.clearAllMocks();

    Element.prototype.scrollIntoView = jest.fn();
});

function getInput() {
    return screen.getByPlaceholderText(
        'You can ask me anything! I am here to help.'
    );
}

describe('Chat', () => {
    test('shows welcome screen initially', () => {
        render(<Chat />);

        expect(screen.getByText('Welcome to StudyMate')).toBeInTheDocument();
        expect(
            screen.getByText(
                /We provide unique live chat training to help you/i
            )
        ).toBeInTheDocument();
    });

    test('updates input value when typing', async () => {
        const user = userEvent.setup();
        render(<Chat />);

        const input = getInput();
        await user.type(input, 'Hello');

        expect(input).toHaveValue('Hello');
    });

    test('sending message calls backend, hides welcome, renders messages + material, clears input', async () => {
        const user = userEvent.setup();

        httpClient.post.mockResolvedValueOnce({
            data: {
                answer: 'Here is the answer',
                material: ['Extra 1', 'Extra 2'],
            },
        });

        render(<Chat />);

        const input = getInput();
        await user.type(input, 'My question');

        const sendButton = screen.getByRole('button');
        await user.click(sendButton);

        await waitFor(() => {
            expect(
                screen.queryByText('Welcome to StudyMate')
            ).not.toBeInTheDocument();
        });

        expect(httpClient.post).toHaveBeenCalledTimes(1);
        expect(httpClient.post).toHaveBeenCalledWith(
            '//localhost:5000/analyze_input',
            { message: 'My question', history: [] }
        );

        expect(await screen.findByText('My question')).toBeInTheDocument();

        expect(
            await screen.findByText('Here is the answer')
        ).toBeInTheDocument();

        expect(await screen.findByText('Extra 1')).toBeInTheDocument();
        expect(await screen.findByText('Extra 2')).toBeInTheDocument();

        await waitFor(() => {
            expect(input).toHaveValue('');
        });

        await waitFor(() => {
            expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
        });
    });

    test('does NOT render material when answer is fallback string', async () => {
        const user = userEvent.setup();

        httpClient.post.mockResolvedValueOnce({
            data: {
                answer: 'Bot was unable to provide a satisfactory answer.',
                material: ['Should not show'],
            },
        });

        render(<Chat />);

        const input = getInput();
        await user.type(input, 'Test');

        const sendButton = screen.getByRole('button');
        await user.click(sendButton);

        expect(await screen.findByText('Test')).toBeInTheDocument();
        expect(
            await screen.findByText(
                'Bot was unable to provide a satisfactory answer.'
            )
        ).toBeInTheDocument();

        expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
    });

    test('does not call backend when message is empty', async () => {
        const user = userEvent.setup();
        render(<Chat />);

        const sendButton = screen.getByRole('button');
        await user.click(sendButton);

        expect(httpClient.post).not.toHaveBeenCalled();
        expect(screen.getByText('Welcome to StudyMate')).toBeInTheDocument();
    });

    test('handles 401 error by alerting', async () => {
        const user = userEvent.setup();
        jest.spyOn(window, 'alert').mockImplementation(() => {});

        httpClient.post.mockRejectedValueOnce({
            response: { status: 401 },
        });

        render(<Chat />);

        const input = getInput();
        await user.type(input, 'Hi');

        const sendButton = screen.getByRole('button');
        await user.click(sendButton);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Invalid credentials.');
        });

        window.alert.mockRestore();
    });

    test("handles non-401 server error by logging 'Server error.'", async () => {
        const user = userEvent.setup();
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        httpClient.post.mockRejectedValueOnce({
            response: { status: 500 },
        });

        render(<Chat />);

        const input = getInput();
        await user.type(input, 'Hi');

        const sendButton = screen.getByRole('button');
        await user.click(sendButton);

        await waitFor(() => {
            expect(logSpy).toHaveBeenCalledWith('Server error.');
        });

        logSpy.mockRestore();
    });
});
