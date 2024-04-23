import axios from 'axios';

type PasswordLoginResponse = {
  mfa_required: {
    type: 'OTP_TOKEN';
    state: string;
  };
  token: null;
};

type TokenLoginResponse = {
  token: string;
};

export const passwordLogin = (email: string, password: string) => {
  return axios.post<PasswordLoginResponse>('https://api.passiv.com/api/v1/auth/login', { email, password });
};

export const tokenLogin = (token: string, twoFactorState: string) => {
  return axios.put<TokenLoginResponse>('https://api.passiv.com/api/v1/auth/login', {
    token,
    state: twoFactorState,
  });
};
