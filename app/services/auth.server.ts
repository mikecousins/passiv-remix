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
  return axios.post<PasswordLoginResponse>('auth/login', { email, password });
};

export const tokenLogin = (token: string, twoFactorState: string) => {
  return axios.put<TokenLoginResponse>('auth/login', {
    token,
    state: twoFactorState,
  });
};
