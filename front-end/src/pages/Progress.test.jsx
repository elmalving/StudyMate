import { render, screen } from '@testing-library/react';
import Progress from './Progress';

describe('Progress', () => {
    test('renders progress placeholder text', () => {
        render(<Progress />);

        expect(
            screen.getByText("There will be student's progress.")
        ).toBeInTheDocument();
    });
});
