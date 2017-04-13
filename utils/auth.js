import decode from 'jwt-decode';
import axios from 'axios';
import Router from 'vue-router';
import Auth0Lock from 'auth0-lock';
const ID_TOKEN_KEY = 'id_token';
const ACCESS_TOKEN_KEY = 'access_token';

var router = new Router({
   mode: 'history',
});

export function login() {
  window.location.href = `https://unicoder.auth0.com/authorize?scope=full_access&audience=http://startupbattle.com&response_type=id_token%20token&client_id=m6WOyitl2hLmn2Afs7oiZKnJHDoZQnSY&redirect_uri=http://localhost:8080/callback&nonce=${generateNonce()}`;
}

export function logout() {
  clearIdToken();
  clearAccessToken();
  router.go('/');
}

export function requireAuth(to, from, next) {
  if (!isLoggedIn()) {
    next({
      path: '/',
      query: { redirect: to.fullPath }
    });
  } else {
    next();
  }
}

export function getIdToken() {
  return localStorage.getItem(ID_TOKEN_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function clearIdToken() {
  localStorage.removeItem(ID_TOKEN_KEY);
}

function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// Helper function that will allow us to extract the access_token and id_token
function getParameterByName(name) {
  let match = RegExp('[#&]' + name + '=([^&]*)').exec(window.location.hash);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

// Get and store access_token in local storage
export function setAccessToken() {
  let accessToken = getParameterByName('access_token');
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

// Get and store id_token in local storage
export function setIdToken() {
  let idToken = getParameterByName('id_token');
  localStorage.setItem(ID_TOKEN_KEY, idToken);
  decodeIdToken(idToken);
}

// Decode id_token to verify the nonce
function decodeIdToken(token) {
  const jwt = decode(token);
  verifyNonce(jwt.nonce);
}

// Function to generate a nonce which will be used to mitigate replay attacks
function generateNonce() {
  let existing = localStorage.getItem('nonce');
  if (existing === null) {
    let nonce = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 16; i++) {
        nonce += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    localStorage.setItem('nonce', nonce);
    return nonce;
  }
  return localStorage.getItem('nonce');
}

// Verify the nonce once user has authenticated. If the nonce can't be verified we'll log the user out
function verifyNonce(nonce) {
  if (nonce !== localStorage.getItem('nonce')) {
    clearIdToken();
    clearAccessToken();
  }

  window.location.href = "/";
}

export function isLoggedIn() {
  const idToken = getIdToken();
  return !!idToken && !isTokenExpired(idToken);
}

function getTokenExpirationDate(encodedToken) {
  const token = decode(encodedToken);
  if (!token.exp) { return null; }

  const date = new Date(0);
  date.setUTCSeconds(token.exp);

  return date;
}

function isTokenExpired(token) {
  const expirationDate = getTokenExpirationDate(token);
  return expirationDate < new Date();
}