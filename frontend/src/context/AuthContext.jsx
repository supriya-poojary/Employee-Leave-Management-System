import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('lms_token');
      const savedUser = localStorage.getItem('lms_user');

      if (token && savedUser) {
        try {
          const response = await authAPI.getProfile();
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: response.data.data, token },
          });
        } catch (error) {
          localStorage.removeItem('lms_token');
          localStorage.removeItem('lms_user');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token, user } = response.data.data;

    localStorage.setItem('lms_token', token);
    localStorage.setItem('lms_user', JSON.stringify(user));

    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    return user;
  };

  const registerUser = async (formData) => {
    const response = await authAPI.register(formData);
    const { token, user } = response.data.data;

    localStorage.setItem('lms_token', token);
    localStorage.setItem('lms_user', JSON.stringify(user));

    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    return user;
  };

  const logout = () => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, registerUser, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
