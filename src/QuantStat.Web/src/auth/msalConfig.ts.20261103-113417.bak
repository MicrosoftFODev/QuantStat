import {
  BrowserCacheLocation,
  PublicClientApplication,
} from '@azure/msal-browser'


export const loginRequest = {
  scopes: [
    'openid',
    'profile',
    'email',
    'User.Read',
  ],
}


export const msalInstance =
  new PublicClientApplication({
    auth: {
      clientId:
        'a5fb1e23-605f-4228-98a7-be4eb2a9bb7d',

      authority:
        'https://login.microsoftonline.com/consumers',

      redirectUri:
        window.location.origin,

      postLogoutRedirectUri:
        window.location.origin,
    },

    cache: {
      cacheLocation:
        BrowserCacheLocation.LocalStorage,
    },
  })