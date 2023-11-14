import Select from 'react-select';
import { useQuery } from '@apollo/client';
import { ALL_BOOKS } from '../Util/Queries';

const Books = ({
  setError,
  show,
  allBooks,
  setSelectedGenre,
  selectedGenre,
}) => {
  const { loading, error, data } = useQuery(ALL_BOOKS, {
    variables: { genre: selectedGenre },
    skip: !selectedGenre,
    onError: () => {
      setError('Failed to fetch books by specified genre!');
    },
  });

  if (!show) {
    return null;
  }

  if (allBooks.loading || loading) {
    return <p>Loading..</p>;
  }

  if (error) {
    return <p>Oops, something went wrong. Please, try again!</p>;
  }

  if (!allBooks || !allBooks.data || !allBooks.data.allBooks) {
    return <p>Data not found</p>;
  }

  const uniqueGenres = new Set();
  const genreOptions = [];
  const books = data ? data.allBooks : allBooks.data.allBooks;

  allBooks.data.allBooks.forEach((b) => {
    b.genres.forEach((g) => {
      if (!uniqueGenres.has(g)) {
        genreOptions.push({ value: g, label: g });
        uniqueGenres.add(g);
      }
    });
  });

  const currentFilter = selectedGenre ? (
    <p>Books in genre {selectedGenre}:</p>
  ) : (
    <p>All books:</p>
  );

  return (
    <div>
      <h2>books</h2>
      {currentFilter}
      {selectedGenre && (
        <button onClick={() => setSelectedGenre(null)}>Remove filters</button>
      )}
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
            <th>genres</th>
          </tr>
          {books.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author}</td>
              <td>{a.published}</td>
              <td>
                {a.genres.map((g) => (
                  <span key={g}>{g} </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <h3>Show by genre:</h3>
        <Select
          defaultValue={genreOptions[0]}
          options={genreOptions}
          onChange={(selectedOption) => setSelectedGenre(selectedOption.value)}
        />
      </div>
    </div>
  );
};

export default Books;
