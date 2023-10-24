import { useState } from 'react';
import { useQuery } from '@apollo/client';

import Authors from './components/Authors';
import Books from './components/Books';
import NewBook from './components/NewBook';

import { ALL_AUTHORS, ALL_BOOKS } from './Util/Queries';
import Notify from './components/Notify';

const App = () => {
  const [page, setPage] = useState('authors');
  const [errorMessage, setErrorMessage] = useState(null);

  const authors = useQuery(ALL_AUTHORS);
  const books = useQuery(ALL_BOOKS);

  const notify = (errorMessage) => {
    setErrorMessage(errorMessage);
    setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  };

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('add')}>add book</button>
      </div>
      <Notify errorMessage={errorMessage} />

      <Authors
        authors={authors}
        show={page === 'authors'}
        setError={notify}
      />

      <Books books={books} show={page === 'books'}/>

      <NewBook show={page === 'add'} />
    </div>
  );
};

export default App;
