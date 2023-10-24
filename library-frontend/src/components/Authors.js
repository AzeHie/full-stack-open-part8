import { Fragment, useState } from 'react';

import './Authors.css';
import { useMutation } from '@apollo/client';
import { ALL_AUTHORS, UPDATE_AUTHOR } from '../Util/Queries';

const Authors = ({ show, authors, setError }) => {
  const [name, setName] = useState('');
  const [born, setBorn] = useState(0);

  const [updateAuthor] = useMutation(UPDATE_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
    onError: (error) => {
      const messages = error.graphQLErrors.map((e) => e.message).join('\n');
      setError(messages);
    },
  });

  if (!show) {
    return null;
  }

  if (authors.loading) {
    return <div>Loading...</div>;
  }

  const submitBirth = async (e) => {
    e.preventDefault();

    let bornToInt = parseInt(born, 10);

    try {
      const result = await updateAuthor({
        variables: { name, born: bornToInt },
      });

      if (result.data.editAuthor === null) {
        setError('Author do not exist');
      }
    } catch (err) {
      setError(err);
    }

    setName('');
    setBorn(0);
  };

  return (
    <Fragment>
      <div>
        <h2>authors</h2>
        <table>
          <tbody>
            <tr>
              <th></th>
              <th>born</th>
              <th>books</th>
            </tr>
            {authors.data.allAuthors.map((a) => (
              <tr key={a.name}>
                <td>{a.name}</td>
                <td>{a.born}</td>
                <td>{a.bookCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <br />
      <div>
        <form className='authors__updateForm' onSubmit={submitBirth}>
          <label>name</label>
          <input
            value={name}
            onChange={({ target }) => setName(target.value)}
          />
          <label>born</label>
          <input
            type='number'
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
          <button type='submit'>Update author</button>
        </form>
      </div>
    </Fragment>
  );
};

export default Authors;
