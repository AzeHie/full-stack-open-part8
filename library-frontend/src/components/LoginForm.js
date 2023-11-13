import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';

import { LOGIN } from '../Util/Queries';

import './LoginForm.css';

const LoginForm = ({ show, setUser, setError, setPage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [userlogin, result] = useMutation(LOGIN, {
    onError: (error) => {
      setError(error.graphQLErrors[0].message);
    }
  });

  useEffect(() => {
    if (result.data) {
      const userData = { token: result.data.login.value, favoriteGenre: result.data.login.favoriteGenre  };
      setUser(userData);
      localStorage.setItem('user', userData);
      setPage('authors');
    }
  }, [result.data, setUser, setPage]);

  if (!show) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    userlogin({ variables: { username, password } });

    setUsername('');
    setPassword('');
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className='loginForm'>
        <label>Username:</label>
        <input
          value={username}
          onChange={({ target }) => setUsername(target.value)}
        />
        <label>Password:</label>
        <input
          type='password'
          value={password}
          onChange={({ target }) => setPassword(target.value)}
        />
        <button type='submit'>Login</button>
      </form>
    </div>
  );
};

export default LoginForm;
