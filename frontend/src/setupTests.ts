import '@testing-library/jest-dom';

// ViewPOIModal restores scroll on unmount; jsdom does not implement scrollTo.
window.scrollTo = jest.fn();
