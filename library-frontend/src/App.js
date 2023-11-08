import { useState } from 'react';
import { useQuery, useApolloClient } from '@apollo/client';

import Authors from './components/Authors';
import Books from './components/Books';
import NewBook from './components/NewBook';

import { ALL_AUTHORS, ALL_BOOKS } from './Util/Queries';
import Notify from './components/Notify';
import LoginForm from './components/LoginForm';
import UpdateAuthor from './components/UpdateAuthor';

const App = () => {
  const [page, setPage] = useState('authors');
  const [errorMessage, setErrorMessage] = useState(null);
  const [token, setToken] = useState(null);

  const authors = useQuery(ALL_AUTHORS);
  const books = useQuery(ALL_BOOKS);
  const client = useApolloClient();


  const notify = (errorMessage) => {
    setErrorMessage(errorMessage);
    setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  };

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
    setPage('author');
  } 

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {token && <button onClick={() => setPage('add')}>add book</button>}
        {token && <button onClick={() => setPage('update')}>Update author</button>}
        {!token && <button onClick={() => setPage('login')}>login</button>}
        {token && <button onClick={logout}>logout</button>}
      </div>
      <Notify errorMessage={errorMessage} />

      <Authors
        authors={authors}
        show={page === 'authors'}
        setError={notify}
      />

      <Books books={books} show={page === 'books'}/>

      <NewBook show={page === 'add'} />

      <UpdateAuthor authors={authors} setError={notify} show={page === 'update'} setPage={setPage} />

      <LoginForm show={page === 'login'} setToken={setToken} setError={notify} setPage={setPage}/>
    </div>
  );
};

export default App;
