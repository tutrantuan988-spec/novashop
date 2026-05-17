/**
 * Facebook Login via JS SDK — không cần Firebase, không cần backend.
 * Yêu cầu: VITE_FACEBOOK_APP_ID trong .env.local
 */

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

function loadFbSdk() {
  return new Promise((resolve) => {
    if (window.FB) { resolve(window.FB); return; }
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v19.0'
      });
      resolve(window.FB);
    };
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
}

function fbLogin(FB) {
  return new Promise((resolve, reject) => {
    FB.login(
      (response) => {
        if (response.authResponse) resolve(response.authResponse);
        else reject(new Error('Người dùng huỷ đăng nhập Facebook'));
      },
      { scope: 'email,public_profile' }
    );
  });
}

function fbGetProfile(FB) {
  return new Promise((resolve, reject) => {
    FB.api('/me', { fields: 'id,name,email,picture.type(large)' }, (profile) => {
      if (profile && !profile.error) resolve(profile);
      else reject(new Error('Không lấy được thông tin Facebook'));
    });
  });
}

export const isFacebookConfigured = () => !!FB_APP_ID;

export async function signInWithFacebookSDK() {
  if (!FB_APP_ID) {
    throw new Error('Chưa cấu hình VITE_FACEBOOK_APP_ID');
  }
  const FB = await loadFbSdk();
  await fbLogin(FB);
  const profile = await fbGetProfile(FB);
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email || '',
    avatar: profile.picture?.data?.url || '',
    provider: 'facebook'
  };
}

export async function fbLogout() {
  if (!window.FB) return;
  return new Promise((resolve) => {
    window.FB.logout(() => resolve());
  });
}
