import Select from 'react-select';

import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { ALL_AUTHORS, UPDATE_AUTHOR } from '../Util/Queries';

const UpdateAuthor = ({ setError, authors }) => {
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [born, setBorn] = useState(0);

  const [updateAuthor] = useMutation(UPDATE_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
    onError: (error) => {
      const messages = error.graphQLErrors.map((e) => e.message).join('\n');
      setError(messages);
    },
  });

  const authorOptions = authors.data.allAuthors.map((a) => {
    return { value: a.name, label: a.name };
  });

  const onSubmitBirthYear = async (e) => {
    e.preventDefault();

    let bornToInt = parseInt(born, 10);

    try {
      const result = await updateAuthor({
        variables: { name: selectedAuthor.value, born: bornToInt },
      });

      if (result.data.editAuthor === null) {
        setError('Author do not exist');
      }
    } catch (err) {
      setError(err);
    }

    setBorn(0);
    setSelectedAuthor(null);
  };

  return (
    <div>
      <h2>Update author's birthday:</h2>
      <form className='authors__updateForm' onSubmit={onSubmitBirthYear}>
        <Select
          defaultValue={authorOptions[0]}
          options={authorOptions}
          onChange={(selectedOption) => {
            setSelectedAuthor(selectedOption);
          }}
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
  );
};

export default UpdateAuthor;
