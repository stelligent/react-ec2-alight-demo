// src/config.js
const protocol = window.location.protocol;
const hostname = window.location.hostname;
const baseUrl = `${protocol}//${hostname}:3001`;

export const config = {
    baseUrl,
};
