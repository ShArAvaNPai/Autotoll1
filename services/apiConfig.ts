export const getBackendUrl = () => {
    const hostname = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
    return `http://${hostname}:8000`;
};
