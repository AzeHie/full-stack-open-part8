import { useState } from 'react';
import { useQuery, useApolloClient, useSubscription } from '@apollo/client';
import { BOOK_ADDED } from './Util/Queries';

import Authors from './components/Authors';
import Books from './components/Books';
import NewBook from './components/NewBook';

import { ALL_AUTHORS, ALL_BOOKS } from './Util/Queries';
import Notify from './components/Notify';
import LoginForm from './components/LoginForm';
import UpdateAuthor from './components/UpdateAuthor';
import Recommendations from './components/Recommendations';

const App = () => {
  const [page, setPage] = useState('authors');
  const [errorMessage, setErrorMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      const bookTitle = data.data.bookAdded.title;
      notify(`New book: ${bookTitle} was added to the book list!`)
    },
  });

  const authors = useQuery(ALL_AUTHORS, {
    onError: () => {
      notify('Failed to fetch authors, please try again later!');
    },
  });
  const books = useQuery(ALL_BOOKS, {
    onError: () => {
      notify('Failed to fetch books, please try again later!');
    },
  });
  const client = useApolloClient();

  const notify = (errorMessage) => {
    setErrorMessage(errorMessage);
    setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
    client.resetStore();
    setPage('author');
  };

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {user && <button onClick={() => setPage('add')}>add book</button>}
        {user && (
          <button onClick={() => setPage('recommend')}>Recommendations</button>
        )}
        {user && (
          <button onClick={() => setPage('update')}>Update author</button>
        )}
        {user && <button onClick={logout}>logout</button>}
        {!user && <button onClick={() => setPage('login')}>login</button>}
      </div>
      <Notify errorMessage={errorMessage} />

      <Authors authors={authors} show={page === 'authors'} setError={notify} />

      <Books
        setError={notify}
        selectedGenre={selectedGenre}
        setSelectedGenre={setSelectedGenre}
        allBooks={books}
        show={page === 'books'}
      />

      <NewBook show={page === 'add'} setPage={setPage} />

      <Recommendations books={books} user={user} show={page === 'recommend'} />

      <UpdateAuthor
        authors={authors}
        setError={notify}
        show={page === 'update'}
        setPage={setPage}
      />

      <LoginForm
        show={page === 'login'}
        setUser={setUser}
        setError={notify}
        setPage={setPage}
      />
    </div>
  );
};

export default App;
