import '@testing-library/jest-dom';

jest.mock('react-markdown', () => {
    return ({ children }) => <div>{children}</div>;
});
