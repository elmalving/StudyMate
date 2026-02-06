import { defineConfig } from 'vite';

export default defineConfig({
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
    moduleNameMapper: {
        '\\.css$': 'identity-obj-proxy',
    },
});
