/* eslint-disable react/display-name, react/prop-types */
import '@testing-library/jest-dom';

jest.mock('react-markdown', () => {
    return ({ children }) => <div>{children}</div>;
});
