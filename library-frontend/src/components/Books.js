import { useState } from 'react';
import Select from 'react-select';

const Books = ({ show, books }) => {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const genreOptions = [];
  const addedGenres = new Set();

  if (books.loading) {
    return <p>Loading..</p>;
  }

  if (!books || !books.data || !books.data.allBooks) {
    return <p>Data not found</p>;
  }

  if (!show) {
    return null;
  }

  let allBooks;
  
  allBooks = books.data.allBooks;

  allBooks.forEach((b) => {
    b.genres.forEach((g) => {
      if (!addedGenres.has(g)) {
        genreOptions.push({ value: g, label: g });
        addedGenres.add(g);
      }
    });
  });

  if (selectedGenre) {
    allBooks = allBooks.filter((b) => b.genres.includes(selectedGenre));
  }

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
          {allBooks.map((a) => (
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
