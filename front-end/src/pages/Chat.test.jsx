import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chat from './Chat';

if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

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
    delete global.fetch;

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

        const chunks = [
            JSON.stringify({ type: 'content', text: 'Here is ' }) + '\n',
            JSON.stringify({ type: 'content', text: 'the answer' }) + '\n',
            JSON.stringify({ type: 'material', urls: ['Extra 1', 'Extra 2'] }) + '\n'
        ];

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            status: 200,
            body: {
                getReader: () => {
                    let idx = 0;
                    return {
                        read: () => {
                            if (idx < chunks.length) {
                                return Promise.resolve({
                                    value: new TextEncoder().encode(chunks[idx++]),
                                    done: false,
                                });
                            }
                            return Promise.resolve({ value: undefined, done: true });
                        },
                    };
                },
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

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            '//localhost:5000/analyze_input',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    message: 'My question',
                    history: [],
                }),
            })
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

        const chunks = [
            JSON.stringify({ type: 'content', text: 'Bot was unable to provide a satisfactory answer.' }) + '\n',
            JSON.stringify({ type: 'material', urls: ['Should not show'] }) + '\n'
        ];

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            status: 200,
            body: {
                getReader: () => {
                    let idx = 0;
                    return {
                        read: () => {
                            if (idx < chunks.length) {
                                return Promise.resolve({
                                    value: new TextEncoder().encode(chunks[idx++]),
                                    done: false,
                                });
                            }
                            return Promise.resolve({ value: undefined, done: true });
                        },
                    };
                },
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
        global.fetch = jest.fn();

        render(<Chat />);

        const sendButton = screen.getByRole('button');
        await user.click(sendButton);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(screen.getByText('Welcome to StudyMate')).toBeInTheDocument();
    });

    test('handles 401 error by alerting', async () => {
        const user = userEvent.setup();
        jest.spyOn(window, 'alert').mockImplementation(() => {});

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false,
            status: 401,
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

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false,
            status: 500,
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
