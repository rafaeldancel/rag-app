"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthClient = getAuthClient;
exports.getAccessToken = getAccessToken;
const google_auth_library_1 = require("google-auth-library");
async function getAuthClient() {
    const auth = new google_auth_library_1.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    return auth.getClient();
}
async function getAccessToken() {
    const client = await getAuthClient();
    const tokenResp = await client.getAccessToken();
    if (!tokenResp.token)
        throw new Error('No access token');
    return tokenResp.token;
}
